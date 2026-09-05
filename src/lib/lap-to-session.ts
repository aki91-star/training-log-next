import { formatMs } from '@/lib/format-time'
import type { Session, WorkBlock, ExerciseRow } from '@/lib/data'
import type { ActiveTimerRun, LapStep, TimerLapRecord } from '@/lib/workout-types'

const LAP_BLOCK_MARKER = 'lap-timer-block'

export function isLapBlock(block: WorkBlock): boolean {
  return block.id === LAP_BLOCK_MARKER || block.id.startsWith('block-lap-')
}

export function getLapRowKind(row: ExerciseRow): '競技' | '移動' {
  if (row.metrics.lapKind) return row.metrics.lapKind
  if (row.exerciseName.startsWith('[移動]')) return '移動'
  if (row.metrics.note?.includes('移動')) return '移動'
  return '競技'
}

export function getLapRowLabel(row: ExerciseRow): string {
  return row.exerciseName.replace(/^\[移動\]\s*/, '')
}

function lapRowFromRecord(lap: TimerLapRecord, order: number): ExerciseRow {
  const { step, splitMs, totalMs } = lap

  return {
    id: `row-lap-${lap.id}`,
    exerciseId: step.id,
    exerciseName: step.label,
    round: 1,
    order,
    status: 'completed',
    metrics: {
      time: splitMs >= 1000 ? Math.round(splitMs / 1000) : undefined,
      distance: step.defaultDistance,
      weight: step.defaultWeight,
      reps: step.defaultReps,
      lapKind: step.kind === 'transition' ? '移動' : '競技',
      lapSplitMs: splitMs,
      lapTotalMs: totalMs,
    },
  }
}

export function applyLapsToSession(session: Session, run: ActiveTimerRun): Session {
  if (run.laps.length === 0) return session

  const rows = run.laps.map((lap, i) => lapRowFromRecord(lap, i + 1))
  const lapBlockIndex = session.blocks.findIndex(
    b => b.id === LAP_BLOCK_MARKER || b.id.startsWith('block-lap-'),
  )

  let blocks: WorkBlock[]
  if (lapBlockIndex >= 0) {
    blocks = session.blocks.map((b, i) =>
      i === lapBlockIndex ? { ...b, rows } : b,
    )
  } else {
    const lapBlock: WorkBlock = {
      id: `block-lap-${run.id}`,
      type: 'サーキット',
      order: session.blocks.length + 1,
      rows,
    }
    blocks = [...session.blocks, lapBlock]
  }

  return { ...session, blocks, linkedTimerRunId: run.id }
}

export function buildLapSummaryNote(run: ActiveTimerRun): string {
  if (run.laps.length === 0) return ''

  const lines = run.laps.map((lap, i) => {
    const kind = lap.step.kind === 'transition' ? '移動' : '競技'
    return `#${i + 1} ${lap.step.label} (${kind}): ${formatMs(lap.splitMs)} / 累計 ${formatMs(lap.totalMs)}`
  })

  const total = run.laps[run.laps.length - 1]?.totalMs ?? run.elapsedMs
  return [
    '--- ラップ計測 ---',
    ...lines,
    `合計: ${formatMs(total)}`,
    `完了: ${run.completedAt ? new Date(run.completedAt).toLocaleString('ja-JP') : ''}`,
  ].filter(Boolean).join('\n')
}

export function appendLapSummaryToNote(session: Session, run: ActiveTimerRun): Session {
  const summary = buildLapSummaryNote(run)
  if (!summary) return session

  const existing = session.note?.trim() ?? ''
  const marker = '--- ラップ計測 ---'
  const base = existing.includes(marker)
    ? existing.slice(0, existing.indexOf(marker)).trimEnd()
    : existing

  return {
    ...session,
    note: base ? `${base}\n\n${summary}` : summary,
  }
}

export function stepsToPlannedMenuPreview(steps: LapStep[]): string {
  return steps
    .map((s, i) => `${i + 1}. [${s.kind === 'transition' ? '移動' : '競技'}] ${s.label}`)
    .join('\n')
}
