export type AppPane = 'history' | 'training' | 'timer' | 'settings'

export const PANE_LABELS: Record<AppPane, string> = {
  history: '履歴',
  training: '記録',
  timer: 'タイマー',
  settings: '設定',
}

export function isAppPane(value: string | null): value is AppPane {
  return value === 'history' || value === 'training' || value === 'timer' || value === 'settings'
}
