// ===== 型定義 =====

export type MainCategory = '筋トレ' | '有酸素' | 'ファンクショナル'

/** ユーザー定義を含む自由入力の小カテゴリ名 */
export type SubCategory = string

export type BlockType = '単体' | 'スーパーセット' | 'サーキット' | 'インターバル'

export type RowStatus = 'completed' | 'draft'

export interface Metric {
  weight?: number   // kg
  bodyweight?: boolean // 自重（重量なしでも完了可）
  reps?: number     // 回
  distance?: number // m
  time?: number     // 秒
  rpe?: number      // 1-10
  note?: string
  lapKind?: '競技' | '移動'
  lapSplitMs?: number  // ラップ計測: 区間タイム (ms)
  lapTotalMs?: number  // ラップ計測: 累計タイム (ms)
}

export interface ExerciseRow {
  id: string
  exerciseId: string
  exerciseName: string
  round: number
  order: number
  status: RowStatus
  metrics: Metric
}

export interface WorkBlock {
  id: string
  type: BlockType
  order: number
  rows: ExerciseRow[]
}

/** 新規セッション用のデフォルトブロック（単体・空） */
export function createDefaultBlock(order = 1): WorkBlock {
  return {
    id: `block-${Date.now()}`,
    type: '単体',
    order,
    rows: [],
  }
}

export interface Session {
  id: string
  date: string       // YYYY-MM-DD
  name: string
  note?: string
  status: 'active' | 'completed'
  blocks: WorkBlock[]
  plannedMenu?: import('@/lib/workout-types').LapStep[]
  linkedTimerRunId?: string
}

/** 履歴（ペイン1）に保存する価値があるセッションか */
export function isPersistableSession(session: Session): boolean {
  if ((session.plannedMenu?.length ?? 0) > 0) return true
  if (session.linkedTimerRunId) return true
  if (session.note?.trim()) return true
  return session.blocks.some(block => block.rows.length > 0)
}

export interface ExerciseMaster {
  id: string
  name: string
  mainCategory: MainCategory
  subCategory: SubCategory
  metrics: (keyof Metric)[]
  completionCondition: (keyof Metric)[]
  progressMetric: 'estimatedRM' | 'time' | 'distance'
}

// ===== 種目マスタ =====

export const exerciseMaster: ExerciseMaster[] = [
  {
    id: 'ex-001',
    name: 'ベンチプレス',
    mainCategory: '筋トレ',
    subCategory: '胸',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-002',
    name: 'インクラインダンベルプレス',
    mainCategory: '筋トレ',
    subCategory: '胸',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-003',
    name: 'デッドリフト',
    mainCategory: '筋トレ',
    subCategory: '背中',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-004',
    name: 'ラットプルダウン',
    mainCategory: '筋トレ',
    subCategory: '背中',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-005',
    name: 'バックスクワット',
    mainCategory: '筋トレ',
    subCategory: '脚',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-006',
    name: 'ショルダープレス',
    mainCategory: '筋トレ',
    subCategory: '肩',
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  },
  {
    id: 'ex-007',
    name: 'ロードラン',
    mainCategory: '有酸素',
    subCategory: '',
    metrics: ['distance', 'time', 'rpe', 'note'],
    completionCondition: ['distance'],
    progressMetric: 'time',
  },
  {
    id: 'ex-008',
    name: 'トレッドミルラン',
    mainCategory: '有酸素',
    subCategory: '',
    metrics: ['distance', 'time', 'rpe', 'note'],
    completionCondition: ['distance', 'time'],
    progressMetric: 'time',
  },
  {
    id: 'ex-009',
    name: 'HYROX Ski Erg',
    mainCategory: 'ファンクショナル',
    subCategory: 'HYROX',
    metrics: ['distance', 'time', 'note'],
    completionCondition: ['distance', 'time'],
    progressMetric: 'time',
  },
  {
    id: 'ex-010',
    name: 'HYROX Sled Push',
    mainCategory: 'ファンクショナル',
    subCategory: 'HYROX',
    metrics: ['distance', 'weight', 'time', 'note'],
    completionCondition: ['distance', 'weight'],
    progressMetric: 'time',
  },
  {
    id: 'ex-011',
    name: 'HYROX Wall Ball',
    mainCategory: 'ファンクショナル',
    subCategory: 'HYROX',
    metrics: ['reps', 'weight', 'time', 'note'],
    completionCondition: ['reps', 'weight'],
    progressMetric: 'time',
  },
]

export const MAIN_CATEGORIES: MainCategory[] = ['筋トレ', '有酸素', 'ファンクショナル']

export const DEFAULT_SUB_CATEGORIES: Record<MainCategory, SubCategory[]> = {
  筋トレ: ['胸', '背中', '肩', '脚', '腕', '腹筋'],
  有酸素: [],
  ファンクショナル: ['HYROX', 'その他'],
}

/** 小カテゴリをユーザーが明示的に作るまで使わない大カテゴリ */
export const SUB_CATEGORY_OPT_IN_MAINS: MainCategory[] = ['有酸素']

export function hasSubCategoryGroups(
  main: MainCategory,
  customSubs: Partial<Record<MainCategory, string[]>> = {},
): boolean {
  if (!SUB_CATEGORY_OPT_IN_MAINS.includes(main)) return true
  return (customSubs[main]?.length ?? 0) > 0
}

export function formatExerciseCategoryLabel(ex: Pick<ExerciseMaster, 'mainCategory' | 'subCategory'>): string {
  if (!ex.subCategory.trim()) return ex.mainCategory
  return `${ex.mainCategory} · ${ex.subCategory}`
}

/** @deprecated DEFAULT_SUB_CATEGORIES を使用 */
export const SUB_CATEGORIES = DEFAULT_SUB_CATEGORIES

export function collectSubCategories(
  main: MainCategory,
  exercises: ExerciseMaster[],
  customSubs: Partial<Record<MainCategory, string[]>> = {},
): SubCategory[] {
  const seen = new Set<string>()
  const result: SubCategory[] = []
  const add = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    result.push(trimmed)
  }

  if (SUB_CATEGORY_OPT_IN_MAINS.includes(main)) {
    for (const sub of customSubs[main] ?? []) add(sub)
    return result
  }

  for (const sub of DEFAULT_SUB_CATEGORIES[main]) add(sub)
  for (const sub of customSubs[main] ?? []) add(sub)
  for (const ex of exercises) {
    if (ex.mainCategory === main) add(ex.subCategory)
  }
  return result
}

export function normalizeExerciseSubCategory(
  exercise: ExerciseMaster,
  customSubs: Partial<Record<MainCategory, string[]>> = {},
): ExerciseMaster {
  if (exercise.mainCategory !== '有酸素') return exercise
  const sub = exercise.subCategory.trim()
  if (!sub) return exercise
  const custom = customSubs['有酸素'] ?? []
  if (custom.includes(sub)) return exercise
  return { ...exercise, subCategory: '' }
}

export function normalizeExercises(
  exercises: ExerciseMaster[],
  customSubs: Partial<Record<MainCategory, string[]>> = {},
): ExerciseMaster[] {
  return exercises.map(ex => normalizeExerciseSubCategory(ex, customSubs))
}

export function defaultMetricsForCategory(
  main: MainCategory,
): Pick<ExerciseMaster, 'metrics' | 'completionCondition' | 'progressMetric'> {
  if (main === '有酸素') {
    return {
      metrics: ['distance', 'time', 'rpe', 'note'],
      completionCondition: ['distance'],
      progressMetric: 'time',
    }
  }
  if (main === 'ファンクショナル') {
    return {
      metrics: ['distance', 'time', 'note'],
      completionCondition: ['distance', 'time'],
      progressMetric: 'time',
    }
  }
  return {
    metrics: ['weight', 'reps', 'rpe', 'note'],
    completionCondition: ['weight', 'reps'],
    progressMetric: 'estimatedRM',
  }
}

export function createExerciseMaster(
  name: string,
  mainCategory: MainCategory,
  subCategory: SubCategory,
  id?: string,
): ExerciseMaster {
  return {
    id: id ?? `ex-custom-${Date.now()}`,
    name,
    mainCategory,
    subCategory,
    ...defaultMetricsForCategory(mainCategory),
  }
}

export function isBuiltInExercise(id: string): boolean {
  return /^ex-\d{3}$/.test(id)
}

// ===== モックセッション =====

export const mockSessions: Session[] = [
  {
    id: 'session-001',
    date: '2026-06-19',
    name: '胸・背中 + ラン',
    status: 'completed',
    blocks: [
      {
        id: 'block-001',
        type: '単体',
        order: 1,
        rows: [
          {
            id: 'row-001',
            exerciseId: 'ex-001',
            exerciseName: 'ベンチプレス',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { weight: 80, reps: 5, rpe: 8 },
          },
          {
            id: 'row-002',
            exerciseId: 'ex-001',
            exerciseName: 'ベンチプレス',
            round: 2,
            order: 2,
            status: 'completed',
            metrics: { weight: 80, reps: 5, rpe: 8.5 },
          },
          {
            id: 'row-003',
            exerciseId: 'ex-001',
            exerciseName: 'ベンチプレス',
            round: 3,
            order: 3,
            status: 'completed',
            metrics: { weight: 75, reps: 6, rpe: 9 },
          },
        ],
      },
      {
        id: 'block-002',
        type: 'スーパーセット',
        order: 2,
        rows: [
          {
            id: 'row-004',
            exerciseId: 'ex-002',
            exerciseName: 'インクラインダンベルプレス',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { weight: 24, reps: 10, rpe: 7 },
          },
          {
            id: 'row-005',
            exerciseId: 'ex-004',
            exerciseName: 'ラットプルダウン',
            round: 1,
            order: 2,
            status: 'completed',
            metrics: { weight: 60, reps: 10, rpe: 7 },
          },
          {
            id: 'row-006',
            exerciseId: 'ex-002',
            exerciseName: 'インクラインダンベルプレス',
            round: 2,
            order: 3,
            status: 'completed',
            metrics: { weight: 24, reps: 8, rpe: 8 },
          },
          {
            id: 'row-007',
            exerciseId: 'ex-004',
            exerciseName: 'ラットプルダウン',
            round: 2,
            order: 4,
            status: 'completed',
            metrics: { weight: 60, reps: 9, rpe: 8 },
          },
        ],
      },
      {
        id: 'block-003',
        type: '単体',
        order: 3,
        rows: [
          {
            id: 'row-008',
            exerciseId: 'ex-007',
            exerciseName: 'ロードラン',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { distance: 5000, time: 1560, rpe: 6 },
          },
        ],
      },
    ],
  },
  {
    id: 'session-002',
    date: '2026-06-17',
    name: 'HYROX練習',
    status: 'completed',
    blocks: [
      {
        id: 'block-004',
        type: 'サーキット',
        order: 1,
        rows: [
          {
            id: 'row-009',
            exerciseId: 'ex-009',
            exerciseName: 'HYROX Ski Erg',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { distance: 1000, time: 210 },
          },
          {
            id: 'row-010',
            exerciseId: 'ex-010',
            exerciseName: 'HYROX Sled Push',
            round: 1,
            order: 2,
            status: 'completed',
            metrics: { distance: 50, weight: 102, time: 95 },
          },
          {
            id: 'row-011',
            exerciseId: 'ex-011',
            exerciseName: 'HYROX Wall Ball',
            round: 1,
            order: 3,
            status: 'completed',
            metrics: { reps: 100, weight: 6, time: 312 },
          },
        ],
      },
    ],
  },
  {
    id: 'session-003',
    date: '2026-06-15',
    name: '脚・肩',
    status: 'completed',
    blocks: [
      {
        id: 'block-005',
        type: '単体',
        order: 1,
        rows: [
          {
            id: 'row-012',
            exerciseId: 'ex-005',
            exerciseName: 'バックスクワット',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { weight: 100, reps: 5, rpe: 8 },
          },
          {
            id: 'row-013',
            exerciseId: 'ex-005',
            exerciseName: 'バックスクワット',
            round: 2,
            order: 2,
            status: 'completed',
            metrics: { weight: 100, reps: 5, rpe: 8.5 },
          },
          {
            id: 'row-014',
            exerciseId: 'ex-005',
            exerciseName: 'バックスクワット',
            round: 3,
            order: 3,
            status: 'completed',
            metrics: { weight: 95, reps: 6, rpe: 9 },
          },
        ],
      },
      {
        id: 'block-006',
        type: '単体',
        order: 2,
        rows: [
          {
            id: 'row-015',
            exerciseId: 'ex-006',
            exerciseName: 'ショルダープレス',
            round: 1,
            order: 1,
            status: 'completed',
            metrics: { weight: 50, reps: 8, rpe: 7 },
          },
          {
            id: 'row-016',
            exerciseId: 'ex-006',
            exerciseName: 'ショルダープレス',
            round: 2,
            order: 2,
            status: 'draft',
            metrics: { weight: 50 },
          },
        ],
      },
    ],
  },
  {
    id: 'session-004',
    date: '2026-06-12',
    name: '肩・アーム',
    status: 'completed',
    blocks: [{
      id: 'block-007', type: '単体', order: 1,
      rows: [{
        id: 'row-017', exerciseId: 'ex-006', exerciseName: 'ショルダープレス',
        round: 1, order: 1, status: 'completed',
        metrics: { weight: 45, reps: 10, rpe: 7 },
      }],
    }],
  },
  {
    id: 'session-005',
    date: '2026-06-09',
    name: '背中',
    status: 'completed',
    blocks: [{
      id: 'block-008', type: '単体', order: 1,
      rows: [{
        id: 'row-018', exerciseId: 'ex-004', exerciseName: 'ラットプルダウン',
        round: 1, order: 1, status: 'completed',
        metrics: { weight: 55, reps: 10, rpe: 7 },
      }, {
        id: 'row-019', exerciseId: 'ex-004', exerciseName: 'ラットプルダウン',
        round: 2, order: 2, status: 'completed',
        metrics: { weight: 55, reps: 9, rpe: 8 },
      }],
    }],
  },
  {
    id: 'session-006',
    date: '2026-06-06',
    name: '脚',
    status: 'completed',
    blocks: [{
      id: 'block-009', type: '単体', order: 1,
      rows: [{
        id: 'row-020', exerciseId: 'ex-005', exerciseName: 'バックスクワット',
        round: 1, order: 1, status: 'completed',
        metrics: { weight: 90, reps: 6, rpe: 8 },
      }, {
        id: 'row-021', exerciseId: 'ex-005', exerciseName: 'バックスクワット',
        round: 2, order: 2, status: 'completed',
        metrics: { weight: 90, reps: 6, rpe: 8.5 },
      }],
    }],
  },
  {
    id: 'session-007',
    date: '2026-06-04',
    name: 'イージーラン',
    status: 'completed',
    blocks: [{
      id: 'block-010', type: '単体', order: 1,
      rows: [{
        id: 'row-022', exerciseId: 'ex-007', exerciseName: 'ロードラン',
        round: 1, order: 1, status: 'completed',
        metrics: { distance: 3000, time: 1080, rpe: 5 },
      }],
    }],
  },
  {
    id: 'session-008',
    date: '2026-06-02',
    name: '胸',
    status: 'completed',
    blocks: [{
      id: 'block-011', type: '単体', order: 1,
      rows: [{
        id: 'row-023', exerciseId: 'ex-001', exerciseName: 'ベンチプレス',
        round: 1, order: 1, status: 'completed',
        metrics: { weight: 75, reps: 6, rpe: 7 },
      }, {
        id: 'row-024', exerciseId: 'ex-001', exerciseName: 'ベンチプレス',
        round: 2, order: 2, status: 'completed',
        metrics: { weight: 75, reps: 6, rpe: 7.5 },
      }],
    }],
  },
]

// ===== ユーティリティ =====

/** Epley法で推定1RMを計算 */
export function calcEstimatedRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/** 秒数を h:mm:ss または mm:ss 形式にフォーマット */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 秒数を時・分・秒の入力用文字列に分解（0 のフィールドは空文字） */
export function decomposeTimeSeconds(total?: number): { h: string; m: string; s: string } {
  if (total == null || total <= 0) return { h: '', m: '', s: '' }
  const hi = Math.floor(total / 3600)
  const mi = Math.floor((total % 3600) / 60)
  const si = total % 60
  return {
    h: hi > 0 ? String(hi) : '',
    m: mi > 0 ? String(mi) : '',
    s: si > 0 ? String(si) : '',
  }
}

/** 時・分・秒の入力文字列を秒数に合成 */
export function composeTimeSeconds(h: string, m: string, s: string): number | undefined {
  if (!h && !m && !s) return undefined
  const hi = h ? parseInt(h, 10) : 0
  const mi = m ? parseInt(m, 10) : 0
  const si = s ? parseInt(s, 10) : 0
  if ([hi, mi, si].some(n => isNaN(n) || n < 0)) return undefined
  const total = hi * 3600 + mi * 60 + si
  return total > 0 ? total : undefined
}

/** 距離を読みやすい形式に */
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

/** メトリクスがセット完了条件を満たすか */
export function isMetricsComplete(metrics: Metric): boolean {
  if (metrics.weight && metrics.reps) return true
  if (metrics.bodyweight && metrics.reps) return true
  if (metrics.distance) return true
  if (metrics.time) return true
  return false
}

/** セット行が完了扱いか（メトリクスまたは status） */
export function isRowCompleted(row: ExerciseRow): boolean {
  return row.status === 'completed' || isMetricsComplete(row.metrics)
}

/** メトリクスから保存用 status を導出 */
export function deriveRowStatus(metrics: Metric): RowStatus {
  return isMetricsComplete(metrics) ? 'completed' : 'draft'
}

/** セッション内の完了セット数を合計 */
export function countCompletedRows(session: Session): number {
  return session.blocks.flatMap(b => b.rows).filter(isRowCompleted).length
}

export const DEFAULT_MONTHLY_GOAL_DAYS = 14
/** @deprecated use DEFAULT_MONTHLY_GOAL_DAYS */
export const MONTHLY_GOAL_DAYS = DEFAULT_MONTHLY_GOAL_DAYS

const CARDIO_NAMES = ['ロードラン', 'トレッドミルラン']

export function isCardioExercise(name: string): boolean {
  return CARDIO_NAMES.some(n => name.includes(n))
}

export function isHyroxExercise(name: string): boolean {
  return name.startsWith('HYROX')
}

export function getCompletedRows(session: Session): ExerciseRow[] {
  return session.blocks.flatMap(b => b.rows).filter(isRowCompleted)
}

/** 総負荷量（トン）= Σ(重量kg × 回数) / 1000 */
export function calcTonnage(session: Session): number {
  return getCompletedRows(session).reduce((sum, r) => {
    const { weight, reps } = r.metrics
    if (weight && reps) return sum + weight * reps
    return sum
  }, 0) / 1000
}

/** 有酸素距離（km） */
export function calcCardioDistanceKm(session: Session): number {
  return getCompletedRows(session).reduce((sum, r) => {
    if (isCardioExercise(r.exerciseName) && r.metrics.distance) {
      return sum + r.metrics.distance / 1000
    }
    return sum
  }, 0)
}

export function sessionHasHyrox(session: Session): boolean {
  return getCompletedRows(session).some(r => isHyroxExercise(r.exerciseName))
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(`${dateStr}T12:00:00`)
  return d >= start && d <= end
}

export interface WeekStats {
  sets: number
  tonnage: number
  cardioKm: number
  hyroxCount: number
}

export function aggregateWeekStats(sessions: Session[]): WeekStats {
  return {
    sets: sessions.reduce((s, sess) => s + countCompletedRows(sess), 0),
    tonnage: sessions.reduce((s, sess) => s + calcTonnage(sess), 0),
    cardioKm: sessions.reduce((s, sess) => s + calcCardioDistanceKm(sess), 0),
    hyroxCount: sessions.filter(sessionHasHyrox).length,
  }
}

export function getSessionsInWeek(sessions: Session[], refDate: Date, offsetWeeks = 0): Session[] {
  const { start, end } = getWeekRange(refDate)
  if (offsetWeeks !== 0) {
    start.setDate(start.getDate() + offsetWeeks * 7)
    end.setDate(end.getDate() + offsetWeeks * 7)
  }
  return sessions.filter(s => isDateInRange(s.date, start, end))
}

export function getUniqueTrainingDatesInMonth(
  sessions: Session[],
  year: number,
  month: number,
): Set<string> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const dates = new Set<string>()
  sessions.forEach(s => {
    if (s.date.startsWith(prefix)) dates.add(s.date)
  })
  return dates
}

export function getSessionsOnDate(sessions: Session[], dateStr: string): Session[] {
  return sessions.filter(s => s.date === dateStr)
}

/** ラップ計測ブロックか（転記対象外） */
export function isLapBlockId(blockId: string): boolean {
  return blockId === 'lap-timer-block' || blockId.startsWith('block-lap-')
}

/** 種目の直近履歴（現在セッションを除く、日付が最も新しいセッション） */
export interface ExerciseHistorySnapshot {
  sessionId: string
  sessionName: string
  date: string
  rows: ExerciseRow[]
}

export function findPreviousExerciseHistory(
  sessions: Session[],
  exerciseId: string,
  excludeSessionId?: string,
): ExerciseHistorySnapshot | null {
  const sorted = [...sessions]
    .filter(s => s.id !== excludeSessionId)
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) return dateCmp
      return b.id.localeCompare(a.id)
    })

  for (const session of sorted) {
    const rows: ExerciseRow[] = []
    for (const block of session.blocks) {
      if (isLapBlockId(block.id)) continue
      for (const row of block.rows) {
        if (row.exerciseId === exerciseId) rows.push(row)
      }
    }
    if (rows.length > 0) {
      rows.sort((a, b) => a.round - b.round)
      return {
        sessionId: session.id,
        sessionName: session.name,
        date: session.date,
        rows,
      }
    }
  }
  return null
}

/** 履歴セッションから記録へ転記できる内容があるか */
export function hasTransferableStructure(session: Session): boolean {
  const hasExerciseBlocks = session.blocks.some(
    b => !isLapBlockId(b.id) && b.rows.length > 0,
  )
  return hasExerciseBlocks || (session.plannedMenu?.length ?? 0) > 0
}

/** セッション構造（種目・セット数・ブロック種別）を複製し、メトリクスは空にする */
export function cloneSessionStructure(
  source: Session,
  opts: { id: string; date: string; name?: string },
): Session {
  const base = Date.now()
  const blocks = source.blocks
    .filter(b => !isLapBlockId(b.id))
    .map((block, blockIdx) => ({
      id: `block-clone-${base}-${blockIdx}`,
      type: block.type,
      order: blockIdx + 1,
      rows: block.rows.map((row, rowIdx) => ({
        id: `row-clone-${base}-${blockIdx}-${rowIdx}`,
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        round: row.round,
        order: row.order,
        status: 'draft' as RowStatus,
        metrics: {},
      })),
    }))

  return {
    id: opts.id,
    date: opts.date,
    name: opts.name ?? source.name,
    status: 'active',
    blocks,
  }
}

export type StatMetric = 'sets' | 'tonnage' | 'cardioKm' | 'hyroxCount' | 'sessions'

export interface TimeSeriesPoint {
  label: string
  date: string
  value: number
}

export interface MonthStats {
  sessions: number
  tonnage: number
  cardioKm: number
  sets: number
}

export function getMetricValue(sessions: Session[], metric: StatMetric): number {
  switch (metric) {
    case 'sets':
      return sessions.reduce((s, sess) => s + countCompletedRows(sess), 0)
    case 'tonnage':
      return sessions.reduce((s, sess) => s + calcTonnage(sess), 0)
    case 'cardioKm':
      return sessions.reduce((s, sess) => s + calcCardioDistanceKm(sess), 0)
    case 'hyroxCount':
      return sessions.filter(sessionHasHyrox).length
    case 'sessions':
      return sessions.length
  }
}

export function aggregateMonthStats(sessions: Session[], year: number, month: number): MonthStats {
  const monthSessions = sessions.filter(s => {
    const d = new Date(`${s.date}T12:00:00`)
    return d.getFullYear() === year && d.getMonth() === month
  })
  return {
    sessions: monthSessions.length,
    tonnage: getMetricValue(monthSessions, 'tonnage'),
    cardioKm: getMetricValue(monthSessions, 'cardioKm'),
    sets: getMetricValue(monthSessions, 'sets'),
  }
}

export function aggregateStatsByWeek(
  sessions: Session[],
  refDate: Date,
  metric: StatMetric,
  weeksBack = 12,
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  for (let i = 0; i < weeksBack; i++) {
    const offsetWeeks = i - (weeksBack - 1)
    const weekSessions = getSessionsInWeek(sessions, refDate, offsetWeeks)
    const { start } = getWeekRange(refDate)
    const weekStart = new Date(start)
    weekStart.setDate(weekStart.getDate() + offsetWeeks * 7)
    points.push({
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      date: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
      value: getMetricValue(weekSessions, metric),
    })
  }
  return points
}

export function aggregateStatsByMonth(
  sessions: Session[],
  refDate: Date,
  metric: StatMetric,
  monthsBack = 6,
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  for (let i = 0; i < monthsBack; i++) {
    const offsetMonths = i - (monthsBack - 1)
    const d = new Date(refDate.getFullYear(), refDate.getMonth() + offsetMonths, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthSessions = sessions.filter(s => {
      const sd = new Date(`${s.date}T12:00:00`)
      return sd.getFullYear() === year && sd.getMonth() === month
    })
    points.push({
      label: `${month + 1}月`,
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      value: getMetricValue(monthSessions, metric),
    })
  }
  return points
}
