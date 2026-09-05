import { auth } from '@/auth'
import { DEFAULT_MONTHLY_GOAL_DAYS, type ExerciseMaster, type Session } from '@/lib/data'
import { getSql, isDatabaseConfigured } from '@/lib/db'
import type { WorkoutMenuTemplate } from '@/lib/workout-types'

type WorkoutPreferences = {
  monthlyGoalDays: number
  timerAlarmEnabled: boolean
  keepScreenOnEnabled: boolean
  exercises?: ExerciseMaster[]
}

type WorkoutPayload = {
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
  preferences?: Partial<WorkoutPreferences>
}

function clampMonthlyGoalDays(value: unknown): number {
  const n = typeof value === 'number' ? value : DEFAULT_MONTHLY_GOAL_DAYS
  return Math.min(31, Math.max(1, Math.round(n)))
}

function parseBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function parsePreferences(raw: unknown): WorkoutPreferences {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const exercises = Array.isArray(obj.exercises) ? obj.exercises as ExerciseMaster[] : undefined
  return {
    monthlyGoalDays: clampMonthlyGoalDays(obj.monthlyGoalDays),
    timerAlarmEnabled: parseBool(obj.timerAlarmEnabled, true),
    keepScreenOnEnabled: parseBool(obj.keepScreenOnEnabled, true),
    exercises,
  }
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
    SELECT sessions, menu_templates, preferences
    FROM user_workout_data
    WHERE "userId" = ${userId}
    LIMIT 1
  `

  if (rows.length === 0) {
    return Response.json({
      sessions: [],
      menuTemplates: [] satisfies WorkoutMenuTemplate[],
      preferences: {
        monthlyGoalDays: DEFAULT_MONTHLY_GOAL_DAYS,
        timerAlarmEnabled: true,
        keepScreenOnEnabled: true,
      },
    })
  }

  const row = rows[0] as {
    sessions: Session[]
    menu_templates: WorkoutMenuTemplate[]
    preferences?: unknown
  }

  return Response.json({
    sessions: row.sessions ?? [],
    menuTemplates: row.menu_templates ?? [],
    preferences: parsePreferences(row.preferences),
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

  const preferences = parsePreferences(body.preferences)

  const sql = getSql()
  await sql`
    INSERT INTO user_workout_data ("userId", sessions, menu_templates, preferences, updated_at)
    VALUES (${userId}, ${body.sessions}, ${body.menuTemplates}, ${preferences}, NOW())
    ON CONFLICT ("userId") DO UPDATE SET
      sessions = EXCLUDED.sessions,
      menu_templates = EXCLUDED.menu_templates,
      preferences = EXCLUDED.preferences,
      updated_at = NOW()
  `

  return Response.json({ ok: true })
}
