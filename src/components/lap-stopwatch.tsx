'use client'

import { useEffect, useRef, useState } from 'react'
import { Flag, Pause, Play, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMs } from '@/lib/format-time'
import { useInterval } from '@/lib/use-interval'
import { useWorkoutStore } from '@/lib/workout-store'
import type { LapStep } from '@/lib/workout-types'
import LinkedSessionBadge from '@/components/linked-session-badge'

function nowMs() {
  return performance.now()
}

export default function LapStopwatch({
  steps,
  menuId,
  onOpenSession,
}: {
  steps: LapStep[]
  menuId?: string
  onOpenSession?: (sessionId: string) => void
}) {
  const {
    activeSessionId,
    activeRun,
    ensureSession,
    startTimerRun,
    pauseTimerRun,
    resumeTimerRun,
    recordLap,
    completeTimerRun,
    resetTimerRun,
    tickTimer,
  } = useWorkoutStore()

  const startAtRef = useRef<number | null>(null)
  const [displayMs, setDisplayMs] = useState(0)

  const run = activeRun
  const isRunning = run?.status === 'running'
  const hasSteps = steps.length > 0
  const currentStep = run
    ? run.steps[run.currentStepIndex]
    : steps[0]

  useInterval(() => {
    if (!isRunning || startAtRef.current === null) return
    const elapsed = nowMs() - startAtRef.current
    setDisplayMs(elapsed)
    tickTimer(elapsed)
  }, isRunning ? 50 : null)

  useEffect(() => {
    if (run?.status === 'running' || run?.status === 'paused') {
      startAtRef.current = run.status === 'running' ? nowMs() - run.elapsedMs : null
      setDisplayMs(run.elapsedMs)
    }
  }, [run?.id, run?.status, run?.elapsedMs])

  function handleStart() {
    if (!hasSteps) return
    if (run && run.status === 'paused') {
      startAtRef.current = nowMs() - run.elapsedMs
      setDisplayMs(run.elapsedMs)
      resumeTimerRun()
      return
    }
    if (run && run.status === 'running') {
      return
    }
    const session = ensureSession(activeSessionId === 'new' ? 'new' : activeSessionId)
    startTimerRun(session.id, steps, menuId)
    startAtRef.current = nowMs()
    setDisplayMs(0)
  }

  function handlePause() {
    if (startAtRef.current !== null) {
      const elapsed = nowMs() - startAtRef.current
      setDisplayMs(elapsed)
      tickTimer(elapsed)
    }
    startAtRef.current = null
    pauseTimerRun()
  }

  function handleReset() {
    startAtRef.current = null
    setDisplayMs(0)
    resetTimerRun()
  }

  function handleLap() {
    if (!run || run.status !== 'running') return
    recordLap()
  }

  function handleComplete() {
    if (startAtRef.current !== null) {
      tickTimer(nowMs() - startAtRef.current)
    }
    completeTimerRun()
    startAtRef.current = null
  }

  const elapsed = run?.elapsedMs ?? displayMs
  const laps = run?.laps ?? []

  return (
    <div className="space-y-3">
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 space-y-4">
        <LinkedSessionBadge onOpenSession={onOpenSession} />

        {currentStep && hasSteps && (
          <p className="text-sm text-center text-gray-300 truncate">
            次: <span className="font-semibold text-orange-400">{currentStep.label}</span>
            <span className="text-gray-500 ml-1.5">
              ({currentStep.kind === 'station' ? '競技' : '移動'})
            </span>
          </p>
        )}

        <p
          className={`text-5xl sm:text-6xl font-bold tabular-nums text-center tracking-tight ${
            hasSteps ? 'text-white' : 'text-gray-600'
          }`}
        >
          {hasSteps ? formatMs(elapsed) : '--:--.--'}
        </p>

        {run && hasSteps && (
          <p className="text-sm text-center text-gray-400">
            {run.currentStepIndex} / {run.steps.length} ステップ
            {run.status === 'completed' && ' · 全ステップ完了'}
          </p>
        )}

        {!hasSteps && (
          <p className="text-sm text-center text-gray-500">
            下のメニュー設定から選択してください
          </p>
        )}

        <div className="space-y-2">
          {isRunning ? (
            <>
              <Button
                type="button"
                className="w-full min-h-14 text-base font-bold bg-orange-500 hover:bg-orange-400"
                onClick={handleLap}
              >
                <Flag size={20} /> ラップ
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="min-h-11 bg-white/10 hover:bg-white/15"
                  onClick={handlePause}
                >
                  <Pause size={16} /> 一時停止
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 border-white/10 bg-white/5"
                  onClick={handleComplete}
                >
                  <Check size={16} /> 完了
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                className="w-full min-h-12 text-base font-bold bg-orange-500 hover:bg-orange-400 disabled:opacity-40"
                onClick={handleStart}
                disabled={!hasSteps}
              >
                <Play size={18} />
                {run?.status === 'paused' ? '再開' : '開始'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 border-white/10 bg-white/5"
                  onClick={handleReset}
                  disabled={!run}
                >
                  <RotateCcw size={16} /> リセット
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 border-white/10 bg-white/5"
                  onClick={handleComplete}
                  disabled={!run}
                >
                  <Check size={16} /> 完了
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {laps.length > 0 && (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8 text-xs text-gray-400">
            ラップ記録（記録ペインに同期済み）
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
            {[...laps].reverse().map((lap, revIdx) => {
              const idx = laps.length - revIdx
              return (
                <div key={lap.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-5">#{idx}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{lap.step.label}</p>
                    <p className="text-xs text-gray-500">
                      {lap.step.kind === 'transition' ? '移動' : '競技'} · 累計 {formatMs(lap.totalMs)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-orange-400">
                    {formatMs(lap.splitMs)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
