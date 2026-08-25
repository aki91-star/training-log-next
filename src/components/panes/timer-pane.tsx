'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Play, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkoutStore } from '@/lib/workout-store'
import { cloneSteps, type LapStep } from '@/lib/workout-types'
import MenuPicker from '@/components/menu-picker'
import LapStopwatch from '@/components/lap-stopwatch'
import RestTimer from '@/components/timers/rest-timer'
import HiitTimer from '@/components/timers/hiit-timer'

type TimerMode = 'rest' | 'stopwatch' | 'hiit'

const MODE_TABS: { id: TimerMode; label: string }[] = [
  { id: 'rest', label: '休憩' },
  { id: 'stopwatch', label: 'ラップ' },
  { id: 'hiit', label: 'HIIT' },
]

export default function TimerPane({
  onOpenSession,
}: {
  onOpenSession?: (sessionId: string) => void
}) {
  const [mode, setMode] = useState<TimerMode>('stopwatch')
  const [steps, setSteps] = useState<LapStep[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>()
  const [menuOpen, setMenuOpen] = useState(true)

  const {
    getLastUsedMenu,
    startFromLastMenu,
    startTimerRun,
    activeSessionId,
    activeRun,
    getSession,
    setActiveSessionId,
    syncMenuToSession,
  } = useWorkoutStore()

  const session = getSession(activeSessionId)
  const lastMenu = getLastUsedMenu()
  const isMeasuring = !!activeRun && (activeRun.status === 'running' || activeRun.status === 'paused')

  useEffect(() => {
    if (session?.plannedMenu?.length) {
      setSteps(cloneSteps(session.plannedMenu))
    }
  }, [session?.id, session?.plannedMenu])

  useEffect(() => {
    if (isMeasuring) setMenuOpen(false)
  }, [isMeasuring])

  function handleStepsChange(newSteps: LapStep[]) {
    setSteps(newSteps)
    if (activeSessionId && activeSessionId !== 'new') {
      syncMenuToSession(activeSessionId, newSteps)
    }
  }

  function handleMenuSelect(menuId: string) {
    setSelectedMenuId(menuId)
  }

  function handleQuickStartLastMenu() {
    const result = startFromLastMenu()
    if (!result) return
    setSteps(cloneSteps(result.menu.steps))
    setSelectedMenuId(result.menu.id)
    setActiveSessionId(result.session.id)
    startTimerRun(result.session.id, result.menu.steps, result.menu.id)
    onOpenSession?.(result.session.id)
  }

  return (
    <div className="space-y-4 px-4 pb-4 lg:px-3">
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
          <LapStopwatch
            steps={steps}
            menuId={selectedMenuId}
            onOpenSession={onOpenSession}
          />

          {!isMeasuring && lastMenu && (
            <Button
              type="button"
              className="w-full min-h-11 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30"
              variant="outline"
              onClick={handleQuickStartLastMenu}
            >
              <Play size={16} />
              前回のメニューで開始（{lastMenu.name}）
            </Button>
          )}

          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3.5 text-left hover:bg-[#222] transition-colors min-h-11"
            >
              <Zap size={16} className="text-orange-400 shrink-0" />
              <span className="flex-1 text-sm font-medium">メニュー設定</span>
              {steps.length > 0 && (
                <span className="text-xs text-gray-500">{steps.length} ステップ</span>
              )}
              <ChevronDown
                size={18}
                className={`text-gray-500 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {menuOpen && (
              <div className="px-4 pb-4 border-t border-white/8 pt-3">
                <MenuPicker
                  steps={steps}
                  onChange={handleStepsChange}
                  onMenuSelect={handleMenuSelect}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
