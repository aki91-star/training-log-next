'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Timer } from 'lucide-react'
import LapMenuSetup from '@/components/lap-menu-setup'
import type { LapStep } from '@/lib/workout-types'

export default function LapMenuBar({
  steps,
  onChange,
  onStartTimer,
  isMeasuring,
  linkedTimerRunId,
  defaultOpen = true,
}: {
  steps: LapStep[]
  onChange: (steps: LapStep[]) => void
  onStartTimer: () => void
  isMeasuring: boolean
  linkedTimerRunId?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (isMeasuring) setOpen(false)
  }, [isMeasuring])

  return (
    <div className="border-b border-white/10 shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors min-h-11"
      >
        <Timer size={16} className="text-orange-400 shrink-0" />
        <span className="flex-1 text-sm font-medium">ラップメニュー</span>
        <span className="text-xs text-gray-500">
          {steps.length > 0 ? `${steps.length} ステップ` : '未設定'}
        </span>
        {linkedTimerRunId && (
          <span className="text-[10px] text-green-400/80">同期済</span>
        )}
        <ChevronDown
          size={18}
          className={`text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {!open && (
        <p className="px-4 pb-2 text-[10px] text-gray-500 leading-snug">
          ラップメニュー＝計測する競技・移動の順序。ここでのみ編集できます。
        </p>
      )}

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] text-gray-500 leading-snug">
            ラップメニュー＝計測する競技・移動の順序。ここでのみ編集できます。
          </p>
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
            <LapMenuSetup
              steps={steps}
              onChange={onChange}
              onStartTimer={onStartTimer}
              readOnly={isMeasuring}
              linkedTimerRunId={linkedTimerRunId}
              isMeasuring={isMeasuring}
            />
          </div>
        </div>
      )}
    </div>
  )
}
