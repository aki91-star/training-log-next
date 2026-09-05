import { createMenuTemplate, createStep, type LapStep, type WorkoutMenuTemplate } from '@/lib/workout-types'

/** HYROX 公式カテゴリ（2026/27 シーズン） */
export type HyroxDivision =
  | 'women_open'
  | 'men_open'
  | 'women_pro'
  | 'men_pro'

export const HYROX_DIVISION_LABELS: Record<HyroxDivision, string> = {
  women_open: 'Women Open',
  men_open: 'Men Open',
  women_pro: 'Women Pro',
  men_pro: 'Men Pro',
}

/** 種目ラベル → kg（Farmers Carry はケトルベル1個あたり） */
const HYROX_WEIGHT_PRESETS: Record<HyroxDivision, Record<string, number>> = {
  women_open: {
    'Sled Push': 102,
    'Sled Pull': 78,
    'Farmers Carry': 16,
    'Sandbag Lunges': 10,
    'Wall Balls': 4,
  },
  men_open: {
    'Sled Push': 152,
    'Sled Pull': 103,
    'Farmers Carry': 24,
    'Sandbag Lunges': 20,
    'Wall Balls': 6,
  },
  women_pro: {
    'Sled Push': 152,
    'Sled Pull': 103,
    'Farmers Carry': 24,
    'Sandbag Lunges': 20,
    'Wall Balls': 6,
  },
  men_pro: {
    'Sled Push': 202,
    'Sled Pull': 153,
    'Farmers Carry': 32,
    'Sandbag Lunges': 30,
    'Wall Balls': 9,
  },
}

const WEIGHT_STATION_LABELS = new Set([
  'Sled Push', 'Sled Pull', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls',
])

/** カテゴリの公式重量をステップに反映（構造は維持） */
export function applyHyroxDivisionWeights(steps: LapStep[], division: HyroxDivision): LapStep[] {
  const presets = HYROX_WEIGHT_PRESETS[division]
  return steps.map(step => {
    if (step.kind !== 'station' || !WEIGHT_STATION_LABELS.has(step.label)) return step
    const weight = presets[step.label]
    return weight != null ? { ...step, defaultWeight: weight } : step
  })
}

/** HYROX 正規: 8×1km Run + 8 stations（競技と移動を交互） */
export function buildHyroxOfficialSteps(division: HyroxDivision = 'men_open'): LapStep[] {
  const stations: Array<{
    label: string
    exerciseId?: string
    defaultDistance?: number
    defaultReps?: number
  }> = [
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'SkiErg', exerciseId: 'ex-009', defaultDistance: 1000 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sled Push', exerciseId: 'ex-010', defaultDistance: 50 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sled Pull', exerciseId: 'ex-010', defaultDistance: 50 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Burpee Broad Jump', defaultDistance: 80 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Row', defaultDistance: 1000 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Farmers Carry', defaultDistance: 200 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Sandbag Lunges', defaultDistance: 100 },
    { label: '1km Run', exerciseId: 'ex-007', defaultDistance: 1000 },
    { label: 'Wall Balls', exerciseId: 'ex-011', defaultReps: 100 },
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
      defaultReps: st.defaultReps,
    }))
  })
  return applyHyroxDivisionWeights(steps, division)
}

export const HYROX_OFFICIAL_MENU: WorkoutMenuTemplate = createMenuTemplate(
  'HYROX 正規（フル）',
  buildHyroxOfficialSteps(),
  'hyrox_official',
)

export const HYROX_OFFICIAL_MENU_ID = 'menu-hyrox-official'
