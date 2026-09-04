'use client'

import { ChevronRight, Timer } from 'lucide-react'
import { formatMs } from '@/lib/format-time'
import type { ActiveTimerRun } from '@/lib/workout-types'

export default function SessionStatusBar({
  run,
  variant,
  onOpenTimer,
  onOpenTraining,
}: {
  run: ActiveTimerRun
  variant: 'training' | 'timer'
  onOpenTimer?: () => void
  onOpenTraining?: () => void
}) {
  const action = variant === 'training' ? onOpenTimer : onOpenTraining
  const actionLabel = variant === 'training' ? 'タイマー' : '記録'

  return (
    <button
      type="button"
      onClick={action}
      className="mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 py-2.5 text-left transition-colors hover:bg-orange-500/25 min-h-11"
    >
      <Timer size={16} className="text-orange-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-orange-300">計測中</p>
        <p className="text-sm text-white truncate">
          {run.laps.length} / {run.steps.length} ラップ
          <span className="text-gray-400 mx-1.5">·</span>
          <span className="tabular-nums">{formatMs(run.elapsedMs)}</span>
        </p>
      </div>
      <span className="flex items-center gap-0.5 text-xs text-orange-400 shrink-0">
        {actionLabel} <ChevronRight size={14} />
      </span>
    </button>
  )
}
