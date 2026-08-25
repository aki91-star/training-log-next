import { createMenuTemplate, createStep, type LapStep, type WorkoutMenuTemplate } from '@/lib/workout-types'

/** HYROX 正規: 8×1km Run + 8 stations（競技と移動を交互） */
export function buildHyroxOfficialSteps(): LapStep[] {
  const stations: Array<{
    label: string
    exerciseId?: string
    defaultDistance?: number
    defaultWeight?: number
    defaultReps?: number
  }> = [
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'SkiErg', exerciseId: 'ex-009', defaultDistance: 1000 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sled Push', exerciseId: 'ex-010', defaultDistance: 50, defaultWeight: 102 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sled Pull', exerciseId: 'ex-010', defaultDistance: 50, defaultWeight: 78 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Burpee Broad Jump', defaultDistance: 80 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Row', defaultDistance: 1000 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Farmers Carry', defaultDistance: 200, defaultWeight: 24 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sandbag Lunges', defaultDistance: 100, defaultWeight: 20 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Wall Balls', exerciseId: 'ex-011', defaultReps: 100, defaultWeight: 6 },
  ]

  const steps: LapStep[] = []
  stations.forEach((st, i) => {
    if (i > 0) {
      steps.push(createStep({
        kind: 'transition',
        label: `移動 ${i}`,
        exerciseId: 'ex-007',
      }))
    }
    steps.push(createStep({
      kind: 'station',
      label: st.label,
      exerciseId: st.exerciseId,
      defaultDistance: st.defaultDistance,
      defaultWeight: st.defaultWeight,
      defaultReps: st.defaultReps,
    }))
  })
  return steps
}

export const HYROX_OFFICIAL_MENU: WorkoutMenuTemplate = createMenuTemplate(
  'HYROX 正規（フル）',
  buildHyroxOfficialSteps(),
  'hyrox_official',
)

export const HYROX_OFFICIAL_MENU_ID = 'menu-hyrox-official'
