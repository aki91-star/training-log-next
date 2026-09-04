'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkoutStore } from '@/lib/workout-store'
import { cloneSteps } from '@/lib/workout-types'
import LapStopwatch from '@/components/lap-stopwatch'
import RestTimer from '@/components/timers/rest-timer'
import HiitTimer from '@/components/timers/hiit-timer'
import SessionStatusBar from '@/components/session-status-bar'

type TimerMode = 'rest' | 'stopwatch' | 'hiit'

const MODE_TABS: { id: TimerMode; label: string }[] = [
  { id: 'rest', label: '休憩' },
  { id: 'stopwatch', label: 'ラップ' },
  { id: 'hiit', label: 'HIIT' },
]

export default function TimerPane({
  onOpenSession,
  onOpenTraining,
}: {
  onOpenSession?: (sessionId: string) => void
  onOpenTraining?: () => void
}) {
  const [mode, setMode] = useState<TimerMode>('rest')

  const {
    getLastUsedMenu,
    startFromLastMenu,
    startTimerRun,
    activeSessionId,
    activeRun,
    getSession,
    setActiveSessionId,
  } = useWorkoutStore()

  const session = getSession(activeSessionId)
  const steps = session?.plannedMenu ? cloneSteps(session.plannedMenu) : []
  const lastMenu = getLastUsedMenu()
  const isMeasuring = !!activeRun && (activeRun.status === 'running' || activeRun.status === 'paused')
  const linkedRun = activeRun && isMeasuring ? activeRun : null

  useEffect(() => {
    if (activeRun && (activeRun.status === 'running' || activeRun.status === 'paused')) {
      setMode('stopwatch')
    } else if (session?.plannedMenu?.length) {
      setMode('stopwatch')
    }
  }, [activeRun?.id, activeRun?.status, session?.id, session?.plannedMenu?.length])

  function handleQuickStartLastMenu() {
    const result = startFromLastMenu()
    if (!result) return
    setActiveSessionId(result.session.id)
    startTimerRun(result.session.id, result.menu.steps, result.menu.id)
    setMode('stopwatch')
    onOpenSession?.(result.session.id)
  }

  const menuSummary = steps.length > 0
    ? `${steps.length} ステップ · ${steps[0].label} → …`
    : null

  return (
    <div className="space-y-4 px-4 pb-4 lg:px-3">
      {linkedRun && (
        <SessionStatusBar
          run={linkedRun}
          variant="timer"
          onOpenTraining={onOpenTraining}
        />
      )}

      <div className="flex gap-1.5">
        {MODE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors min-h-11 ${
              mode === id
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] border border-white/10 text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'rest' && <RestTimer />}
      {mode === 'hiit' && <HiitTimer />}

      {mode === 'stopwatch' && (
        <div className="space-y-4">
          {!isMeasuring && steps.length > 0 && menuSummary && (
            <p className="text-xs text-gray-400 text-center px-2">{menuSummary}</p>
          )}

          <LapStopwatch
            steps={steps}
            onOpenSession={onOpenSession}
            onOpenTraining={onOpenTraining}
          />

          {!isMeasuring && lastMenu && (
            <Button
              type="button"
              className="w-full min-h-11 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30"
              variant="outline"
              onClick={handleQuickStartLastMenu}
            >
              <Play size={16} />
              前回のラップメニューで開始（{lastMenu.name}）
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
