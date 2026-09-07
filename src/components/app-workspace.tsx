'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PaneNav from '@/components/pane-nav'
import HistoryPane from '@/components/panes/history-pane'
import TrainingPane from '@/components/panes/training-pane'
import TimerPane from '@/components/panes/timer-pane'
import SettingsPane from '@/components/panes/settings-pane'
import AppLogo from '@/components/app-logo'
import UserAvatar from '@/components/user-avatar'
import { APP_NAME } from '@/lib/app-config'
import { getLocalDateString } from '@/lib/date-utils'
import { type Session } from '@/lib/data'
import { useWorkoutStore } from '@/lib/workout-store'
import { type AppPane, isAppPane } from '@/lib/panes'

function resolveTrainingSessionId(
  sessionParam: string | null,
  activeSessionId: string,
  getSession: (id: string) => Session | undefined,
): string {
  const today = getLocalDateString()
  const candidate = sessionParam ?? activeSessionId ?? 'new'
  if (candidate === 'new') return 'new'

  const session = getSession(candidate)
  if (!session) return 'new'
  if (session.status === 'completed') return candidate
  if (session.date === today) return candidate

  return 'new'
}

function PaneHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="app-pane-header">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AppWorkspaceInner({ initialPane = 'history' }: { initialPane?: AppPane }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paneParam = searchParams.get('pane')
  const sessionParam = searchParams.get('session')

  const {
    setActiveSessionId,
    activeSessionId,
    activeRun,
    pauseTimerRun,
    getSession,
    startFromSession,
  } = useWorkoutStore()

  const [activePane, setActivePane] = useState<AppPane>(
    isAppPane(paneParam) ? paneParam : initialPane,
  )
  const [settingsSubMode, setSettingsSubMode] = useState<'main' | 'menus' | 'exercises'>('main')

  useEffect(() => {
    if (isAppPane(paneParam)) setActivePane(paneParam)
  }, [paneParam])

  useEffect(() => {
    if (activePane !== 'settings') setSettingsSubMode('main')
  }, [activePane])

  useEffect(() => {
    if (sessionParam) setActiveSessionId(sessionParam)
  }, [sessionParam, setActiveSessionId])

  const selectPane = useCallback((pane: AppPane) => {
    setActivePane(pane)
    const params = new URLSearchParams()
    params.set('pane', pane)
    if (pane === 'training') {
      params.set('session', resolveTrainingSessionId(null, activeSessionId, getSession))
    } else if (pane === 'timer') {
      params.set('session', activeSessionId)
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [router, activeSessionId, getSession])

  const openSession = useCallback((sessionId: string) => {
    if (
      activeRun &&
      (activeRun.status === 'running' || activeRun.status === 'paused') &&
      activeRun.sessionId !== sessionId
    ) {
      const ok = window.confirm('計測中のセッションがあります。切り替えると計測が一時停止されます。続けますか？')
      if (!ok) return
      pauseTimerRun()
    }
    setActiveSessionId(sessionId)
    setActivePane('training')
    router.replace(`/?pane=training&session=${sessionId}`, { scroll: false })
  }, [router, setActiveSessionId, activeRun, pauseTimerRun])

  const startNewSession = useCallback(() => {
    setActiveSessionId('new')
    setActivePane('training')
    router.replace('/?pane=training&session=new', { scroll: false })
  }, [router, setActiveSessionId])

  const transferSessionToRecording = useCallback((sourceSessionId: string) => {
    if (
      activeRun &&
      (activeRun.status === 'running' || activeRun.status === 'paused')
    ) {
      const ok = window.confirm('計測中のセッションがあります。切り替えると計測が一時停止されます。続けますか？')
      if (!ok) return
      pauseTimerRun()
    }
    const session = startFromSession(sourceSessionId)
    if (!session) return
    setActiveSessionId(session.id)
    setActivePane('training')
    router.replace(`/?pane=training&session=${session.id}`, { scroll: false })
  }, [router, setActiveSessionId, activeRun, pauseTimerRun, startFromSession])

  const handleSessionResolved = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    if (activePane === 'training') {
      router.replace(`/?pane=training&session=${sessionId}`, { scroll: false })
    }
  }, [setActiveSessionId, activePane, router])

  const startTimerFromTraining = useCallback(() => {
    setActivePane('timer')
    router.replace(`/?pane=timer&session=${activeSessionId}`, { scroll: false })
  }, [router, activeSessionId])

  const openTrainingPane = useCallback(() => {
    setActivePane('training')
    const params = new URLSearchParams()
    params.set('pane', 'training')
    params.set('session', resolveTrainingSessionId(null, activeSessionId, getSession))
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [router, activeSessionId, getSession])

  const isMeasuring = !!activeRun && (activeRun.status === 'running' || activeRun.status === 'paused')

  return (
    <div className="app-workspace">
      <header className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-white/10 bg-[#0d0d0d]">
        <AppLogo
          size="sm"
          showName
          title={APP_NAME}
          className="lg:hidden [&_p:first-of-type]:text-[11px] [&_p:first-of-type]:leading-snug [&_p:first-of-type]:tracking-tight max-w-[calc(100vw-5rem)]"
        />
        <AppLogo
          size="md"
          showName
          showTagline
          title={APP_NAME}
          tagline="4ペイン · 履歴 / 記録 / タイマー / 設定"
          className="hidden lg:flex [&_p:first-of-type]:text-lg"
        />
        <UserAvatar />
      </header>

      <div className="app-workspace-grid">
        <section
          className={`app-pane ${activePane === 'history' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="履歴"
        >
          <PaneHeader title="履歴" subtitle="カレンダー・月次合計・セッション一覧" />
          <div className="app-pane-body">
            <HistoryPane
              onOpenSession={openSession}
              onStartNew={startNewSession}
              onTransferToRecording={transferSessionToRecording}
            />
          </div>
        </section>

        <section
          className={`app-pane ${activePane === 'training' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="記録"
        >
          <PaneHeader title="記録" subtitle="ラップメニュー · 種目入力" />
          <div className="app-pane-body app-pane-body-flush">
            <TrainingPane
              sessionId={resolveTrainingSessionId(sessionParam, activeSessionId, getSession)}
              onComplete={() => selectPane('history')}
              onSessionResolved={handleSessionResolved}
              onStartTimer={startTimerFromTraining}
            />
          </div>
        </section>

        <section
          className={`app-pane ${activePane === 'timer' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="タイマー"
        >
          <PaneHeader title="タイマー" subtitle="ラップ計測 · 休憩 · HIIT" />
          <div className="app-pane-body">
            <TimerPane onOpenSession={openSession} onOpenTraining={openTrainingPane} />
          </div>
        </section>

        <section
          className={`app-pane ${activePane === 'settings' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="設定"
        >
          <PaneHeader
            title={
              settingsSubMode === 'menus'
                ? 'セットメニュー管理'
                : settingsSubMode === 'exercises'
                  ? '種目管理'
                  : '設定'
            }
            subtitle={
              settingsSubMode === 'menus'
                ? 'HYROX等の複合メニュー'
                : settingsSubMode === 'exercises'
                  ? 'ベンチプレス等の種目マスタ'
                  : '個人設定・バックアップ'
            }
          />
          <div className="app-pane-body">
            <SettingsPane onSubModeChange={setSettingsSubMode} />
          </div>
        </section>
      </div>

      <PaneNav active={activePane} onChange={selectPane} isMeasuring={isMeasuring} className="lg:hidden" />
    </div>
  )
}

export default function AppWorkspace(props: { initialPane?: AppPane }) {
  return <AppWorkspaceInner {...props} />
}
