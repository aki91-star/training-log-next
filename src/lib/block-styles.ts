import type { BlockType, ExerciseRow } from './data'

export const BLOCK_TYPE_CLS: Record<BlockType, string> = {
  '単体':           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'スーパーセット': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'サーキット':     'bg-green-500/20 text-green-300 border-green-500/30',
  'インターバル':   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export const BLOCK_CONTAINER_CLS: Partial<Record<BlockType, string>> = {
  'スーパーセット': 'border-purple-500/30 bg-purple-500/[0.04]',
}

export function getExerciseOrder(rows: ExerciseRow[]): string[] {
  const order: string[] = []
  rows.forEach(r => {
    if (!order.includes(r.exerciseId)) order.push(r.exerciseId)
  })
  return order
}

export function groupRowsByExercise(rows: ExerciseRow[]): Record<string, ExerciseRow[]> {
  const groupMap: Record<string, ExerciseRow[]> = {}
  rows.forEach(r => {
    if (!groupMap[r.exerciseId]) groupMap[r.exerciseId] = []
    groupMap[r.exerciseId].push(r)
  })
  return groupMap
}

export function groupRowsByRound(rows: ExerciseRow[]): { round: number; rows: ExerciseRow[] }[] {
  const map = new Map<number, ExerciseRow[]>()
  rows.forEach(r => {
    const list = map.get(r.round) ?? []
    list.push(r)
    map.set(r.round, list)
  })
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, roundRows]) => ({
      round,
      rows: roundRows.sort((a, b) => a.order - b.order),
    }))
}

export function getExerciseLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

export function getMaxRound(rows: ExerciseRow[]): number {
  return rows.length > 0 ? Math.max(...rows.map(r => r.round)) : 0
}
