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
import { useWorkoutStore } from '@/lib/workout-store'
import { type AppPane, isAppPane } from '@/lib/panes'

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
  } = useWorkoutStore()

  const [activePane, setActivePane] = useState<AppPane>(
    isAppPane(paneParam) ? paneParam : initialPane,
  )

  useEffect(() => {
    if (isAppPane(paneParam)) setActivePane(paneParam)
  }, [paneParam])

  useEffect(() => {
    if (sessionParam) setActiveSessionId(sessionParam)
  }, [sessionParam, setActiveSessionId])

  const selectPane = useCallback((pane: AppPane) => {
    setActivePane(pane)
    const params = new URLSearchParams()
    params.set('pane', pane)
    if (pane === 'training' || pane === 'timer') {
      params.set('session', activeSessionId)
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [router, activeSessionId])

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

  return (
    <div className="app-workspace">
      <header className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-white/10 bg-[#0d0d0d]">
        <AppLogo
          size="sm"
          showName
          className="lg:hidden"
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
            <HistoryPane onOpenSession={openSession} onStartNew={startNewSession} />
          </div>
        </section>

        <section
          className={`app-pane ${activePane === 'training' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="記録"
        >
          <PaneHeader title="記録" subtitle="トレーニング内容の入力" />
          <div className="app-pane-body app-pane-body-flush">
            <TrainingPane
              sessionId={sessionParam ?? activeSessionId ?? 'new'}
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
          <PaneHeader title="タイマー" subtitle="休憩・Hyroxラップ・HIIT" />
          <div className="app-pane-body">
            <TimerPane onOpenSession={openSession} />
          </div>
        </section>

        <section
          className={`app-pane ${activePane === 'settings' ? 'app-pane-active' : 'app-pane-hidden-mobile'}`}
          aria-label="設定"
        >
          <PaneHeader title="設定" subtitle="個人設定・バックアップ" />
          <div className="app-pane-body">
            <SettingsPane />
          </div>
        </section>
      </div>

      <PaneNav active={activePane} onChange={selectPane} className="lg:hidden" />
    </div>
  )
}

export default function AppWorkspace(props: { initialPane?: AppPane }) {
  return <AppWorkspaceInner {...props} />
}
