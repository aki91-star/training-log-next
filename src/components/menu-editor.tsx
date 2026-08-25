'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createStep, type LapStep, type LapStepKind } from '@/lib/workout-types'

export default function MenuEditor({
  steps,
  onChange,
  readOnly = false,
}: {
  steps: LapStep[]
  onChange: (steps: LapStep[]) => void
  readOnly?: boolean
}) {
  function updateStep(id: string, patch: Partial<LapStep>) {
    onChange(steps.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id))
  }

  function addStep(kind: LapStepKind = 'station') {
    onChange([
      ...steps,
      createStep({
        kind,
        label: kind === 'transition' ? '移動' : '新規種目',
      }),
    ])
  }

  function moveStep(index: number, dir: -1 | 1) {
    const next = [...steps]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  if (steps.length === 0 && !readOnly) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-sm text-gray-500">メニューが未設定です</p>
        <div className="flex gap-2 justify-center">
          <Button type="button" size="sm" className="bg-orange-500 hover:bg-orange-400" onClick={() => addStep('station')}>
            <Plus size={14} /> 競技を追加
          </Button>
          <Button type="button" size="sm" variant="outline" className="border-white/10" onClick={() => addStep('transition')}>
            <Plus size={14} /> 移動を追加
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={step.id} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="text-gray-600 hover:text-gray-400 disabled:opacity-30 text-[10px]">▲</button>
                <GripVertical size={12} className="text-gray-600" />
                <button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="text-gray-600 hover:text-gray-400 disabled:opacity-30 text-[10px]">▼</button>
              </div>
            )}
            <span className="text-xs text-gray-600 w-5">#{index + 1}</span>
            <select
              value={step.kind}
              disabled={readOnly}
              onChange={e => updateStep(step.id, { kind: e.target.value as LapStepKind })}
              className="bg-[#252525] border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
            >
              <option value="station">競技</option>
              <option value="transition">移動</option>
            </select>
            <input
              type="text"
              value={step.label}
              disabled={readOnly}
              onChange={e => updateStep(step.id, { label: e.target.value })}
              className="flex-1 bg-[#252525] border border-white/10 rounded-lg px-2 py-1 text-sm outline-none min-w-0"
            />
            {!readOnly && (
              <button type="button" onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {step.kind === 'station' && (
            <div className="grid grid-cols-3 gap-2 pl-7">
              {([
                ['距離(m)', 'defaultDistance'],
                ['重量(kg)', 'defaultWeight'],
                ['回数', 'defaultReps'],
              ] as const).map(([label, key]) => (
                <label key={key} className="text-[10px] text-gray-500">
                  {label}
                  <input
                    type="number"
                    disabled={readOnly}
                    value={step[key] ?? ''}
                    onChange={e => updateStep(step.id, {
                      [key]: e.target.value ? Number(e.target.value) : undefined,
                    })}
                    className="mt-0.5 w-full bg-[#252525] border border-white/10 rounded px-2 py-1 text-xs outline-none"
                    placeholder="—"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" className="flex-1 border-white/10 text-xs" onClick={() => addStep('station')}>
            <Plus size={14} /> 競技
          </Button>
          <Button type="button" size="sm" variant="outline" className="flex-1 border-white/10 text-xs" onClick={() => addStep('transition')}>
            <Plus size={14} /> 移動
          </Button>
        </div>
      )}
    </div>
  )
}
