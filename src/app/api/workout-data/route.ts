import { auth } from '@/auth'
import { getSql, isDatabaseConfigured } from '@/lib/db'
import type { Session } from '@/lib/data'
import type { WorkoutMenuTemplate } from '@/lib/workout-types'

type WorkoutPayload = {
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
}

function parseUserId(raw: string | undefined): number | null {
  if (!raw) return null
  const id = Number.parseInt(raw, 10)
  return Number.isFinite(id) ? id : null
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'Database not configured' }, { status: 503 })
  }

  const session = await auth()
  const userId = parseUserId(session?.user?.id)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getSql()
  const rows = await sql`
    SELECT sessions, menu_templates
    FROM user_workout_data
    WHERE "userId" = ${userId}
    LIMIT 1
  `

  if (rows.length === 0) {
    return Response.json({ sessions: [], menuTemplates: [] satisfies WorkoutMenuTemplate[] })
  }

  const row = rows[0] as {
    sessions: Session[]
    menu_templates: WorkoutMenuTemplate[]
  }

  return Response.json({
    sessions: row.sessions ?? [],
    menuTemplates: row.menu_templates ?? [],
  })
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'Database not configured' }, { status: 503 })
  }

  const session = await auth()
  const userId = parseUserId(session?.user?.id)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: WorkoutPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.sessions) || !Array.isArray(body.menuTemplates)) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const sql = getSql()
  await sql`
    INSERT INTO user_workout_data ("userId", sessions, menu_templates, updated_at)
    VALUES (${userId}, ${body.sessions}, ${body.menuTemplates}, NOW())
    ON CONFLICT ("userId") DO UPDATE SET
      sessions = EXCLUDED.sessions,
      menu_templates = EXCLUDED.menu_templates,
      updated_at = NOW()
  `

  return Response.json({ ok: true })
}
