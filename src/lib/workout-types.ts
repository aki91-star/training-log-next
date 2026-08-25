export type LapStepKind = 'station' | 'transition'

export interface LapStep {
  id: string
  kind: LapStepKind
  exerciseId?: string
  label: string
  defaultDistance?: number
  defaultWeight?: number
  defaultReps?: number
}

export type MenuTemplateSource = 'hyrox_official' | 'custom' | 'session_derived'

export interface WorkoutMenuTemplate {
  id: string
  name: string
  source: MenuTemplateSource
  steps: LapStep[]
  createdAt: string
  lastUsedAt?: string
}

export interface TimerLapRecord {
  id: string
  stepIndex: number
  step: LapStep
  splitMs: number
  totalMs: number
  recordedAt: string
}

export type TimerRunStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface ActiveTimerRun {
  id: string
  sessionId: string
  menuId?: string
  steps: LapStep[]
  status: TimerRunStatus
  currentStepIndex: number
  laps: TimerLapRecord[]
  startedAt?: string
  completedAt?: string
  elapsedMs: number
  lapAtMs: number
}

export function cloneSteps(steps: LapStep[]): LapStep[] {
  return steps.map(s => ({ ...s }))
}

export function createStep(
  partial: Omit<LapStep, 'id'> & { id?: string },
): LapStep {
  return {
    id: partial.id ?? `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: partial.kind,
    exerciseId: partial.exerciseId,
    label: partial.label,
    defaultDistance: partial.defaultDistance,
    defaultWeight: partial.defaultWeight,
    defaultReps: partial.defaultReps,
  }
}

export function createMenuTemplate(
  name: string,
  steps: LapStep[],
  source: MenuTemplateSource = 'custom',
): WorkoutMenuTemplate {
  return {
    id: `menu-${Date.now()}`,
    name,
    source,
    steps: cloneSteps(steps),
    createdAt: new Date().toISOString(),
  }
}
