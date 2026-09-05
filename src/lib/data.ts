// ===== 型定義 =====

export type MainCategory = '筋トレ' | '有酸素' | 'ファンクショナル'

export type SubCategory =
  | '胸' | '背中' | '肩' | '脚' | '腕' | '腹筋'
  | 'ラン' | 'バイク' | 'クロストレーナー' | 'ステアクライマー'
  | 'HYROX'

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
    subCategory: 'ラン',
    metrics: ['distance', 'time', 'rpe', 'note'],
    completionCondition: ['distance'],
    progressMetric: 'time',
  },
  {
    id: 'ex-008',
    name: 'トレッドミルラン',
    mainCategory: '有酸素',
    subCategory: 'ラン',
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

export const SUB_CATEGORIES: Record<MainCategory, SubCategory[]> = {
  筋トレ: ['胸', '背中', '肩', '脚', '腕', '腹筋'],
  有酸素: ['ラン', 'バイク', 'クロストレーナー', 'ステアクライマー'],
  ファンクショナル: ['HYROX'],
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

/** 秒数を時・分・秒の入力用文字列に分解 */
export function decomposeTimeSeconds(total?: number): { h: string; m: string; s: string } {
  if (total == null || total <= 0) return { h: '', m: '', s: '' }
  const hi = Math.floor(total / 3600)
  const mi = Math.floor((total % 3600) / 60)
  const si = total % 60
  return {
    h: hi > 0 ? String(hi) : '',
    m: hi > 0 || mi > 0 ? String(mi).padStart(2, '0') : '',
    s: hi > 0 || mi > 0 ? String(si).padStart(2, '0') : String(si),
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
