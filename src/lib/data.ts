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

export interface Session {
  id: string
  date: string       // YYYY-MM-DD
  name: string
  note?: string
  status: 'active' | 'completed'
  blocks: WorkBlock[]
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
]

// ===== ユーティリティ =====

/** Epley法で推定1RMを計算 */
export function calcEstimatedRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/** 秒数を mm:ss 形式にフォーマット */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 距離を読みやすい形式に */
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

/** セッション内の完了セット数を合計 */
export function countCompletedRows(session: Session): number {
  return session.blocks.flatMap(b => b.rows).filter(r => r.status === 'completed').length
}
