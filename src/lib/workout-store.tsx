'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from 'next-auth/react'
import { createDefaultBlock, mockSessions, type Session } from '@/lib/data'
import {
  HYROX_OFFICIAL_MENU,
  HYROX_OFFICIAL_MENU_ID,
} from '@/lib/hyrox-official-menu'
import {
  appendLapSummaryToNote,
  applyLapsToSession,
} from '@/lib/lap-to-session'
import {
  cloneSteps,
  createMenuTemplate,
  type ActiveTimerRun,
  type LapStep,
  type WorkoutMenuTemplate,
} from '@/lib/workout-types'

const STORAGE_KEYS = {
  sessions: 'training-log:sessions',
  menuTemplates: 'training-log:menu-templates',
  activeRun: 'training-log:active-run',
  lastMenuId: 'training-log:last-menu-id',
  activeSessionId: 'training-log:active-session-id',
  seeded: 'training-log:seeded-v1',
} as const

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

let sessionIdCounter = 0

function newSessionId(): string {
  sessionIdCounter += 1
  return `session-${Date.now()}-${sessionIdCounter}`
}

function dedupeSessions(sessions: Session[]): Session[] {
  const seen = new Set<string>()
  return sessions.filter(session => {
    if (seen.has(session.id)) return false
    seen.add(session.id)
    return true
  })
}

function newSessionFromTemplate(name?: string): Session {
  return {
    id: newSessionId(),
    date: new Date().toISOString().slice(0, 10),
    name: name ?? '新規セッション',
    status: 'active',
    blocks: [createDefaultBlock()],
  }
}

function seedInitialState(): {
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
} {
  const official = { ...HYROX_OFFICIAL_MENU, id: HYROX_OFFICIAL_MENU_ID }
  return {
    sessions: mockSessions.map(s => ({ ...s })),
    menuTemplates: [official],
  }
}

type WorkoutStoreValue = {
  hydrated: boolean
  cloudSynced: boolean
  cloudSyncing: boolean
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
  activeSessionId: string
  activeRun: ActiveTimerRun | null
  lastMenuId: string | null

  getSession: (id: string) => Session | undefined
  getActiveSession: () => Session | undefined
  setActiveSessionId: (id: string) => void

  createSession: (name?: string) => Session
  updateSession: (session: Session) => void
  ensureSession: (id: string) => Session

  saveMenuTemplate: (template: WorkoutMenuTemplate) => void
  deleteMenuTemplate: (id: string) => void
  duplicateMenuTemplate: (id: string, newName?: string) => WorkoutMenuTemplate | null
  getLastUsedMenu: () => WorkoutMenuTemplate | null
  setLastUsedMenu: (menuId: string) => void

  syncMenuToSession: (sessionId: string, steps: LapStep[]) => void

  startTimerRun: (sessionId: string, steps: LapStep[], menuId?: string) => ActiveTimerRun
  pauseTimerRun: () => void
  resumeTimerRun: () => void
  recordLap: () => void
  completeTimerRun: () => void
  resetTimerRun: () => void
  tickTimer: (elapsedMs: number) => void

  startFromLastMenu: () => { session: Session; menu: WorkoutMenuTemplate } | null
}

const WorkoutContext = createContext<WorkoutStoreValue | null>(null)

async function fetchCloudWorkoutData(): Promise<{
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
} | null> {
  try {
    const res = await fetch('/api/workout-data')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function uploadCloudWorkoutData(
  sessions: Session[],
  menuTemplates: WorkoutMenuTemplate[],
): Promise<boolean> {
  try {
    const res = await fetch('/api/workout-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions, menuTemplates }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { data: authSession, status: authStatus } = useSession()
  const isAuthenticated = authStatus === 'authenticated' && Boolean(authSession?.user)

  const [hydrated, setHydrated] = useState(false)
  const [cloudSynced, setCloudSynced] = useState(false)
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [menuTemplates, setMenuTemplates] = useState<WorkoutMenuTemplate[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState('new')
  const [activeRun, setActiveRun] = useState<ActiveTimerRun | null>(null)
  const [lastMenuId, setLastMenuIdState] = useState<string | null>(null)
  const skipNextCloudSave = useRef(false)
  const sessionsForApp = useMemo(() => dedupeSessions(sessions), [sessions])

  useEffect(() => {
    const seeded = localStorage.getItem(STORAGE_KEYS.seeded)
    if (!seeded) {
      const initial = seedInitialState()
      saveJson(STORAGE_KEYS.sessions, initial.sessions)
      saveJson(STORAGE_KEYS.menuTemplates, initial.menuTemplates)
      localStorage.setItem(STORAGE_KEYS.seeded, '1')
      setSessions(dedupeSessions(initial.sessions))
      setMenuTemplates(initial.menuTemplates)
    } else {
      setSessions(dedupeSessions(loadJson(STORAGE_KEYS.sessions, mockSessions)))
      setMenuTemplates(loadJson(STORAGE_KEYS.menuTemplates, [HYROX_OFFICIAL_MENU]))
    }
    setActiveRun(loadJson<ActiveTimerRun | null>(STORAGE_KEYS.activeRun, null))
    setLastMenuIdState(localStorage.getItem(STORAGE_KEYS.lastMenuId))
    setActiveSessionIdState(
      localStorage.getItem(STORAGE_KEYS.activeSessionId) ?? 'new',
    )
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.sessions, sessionsForApp)
  }, [sessionsForApp, hydrated, isAuthenticated, cloudSynced])

  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.menuTemplates, menuTemplates)
  }, [menuTemplates, hydrated, isAuthenticated, cloudSynced])

  useEffect(() => {
    if (!hydrated || authStatus === 'loading') return

    if (!isAuthenticated) {
      setCloudSynced(false)
      setCloudSyncing(false)
      return
    }

    let cancelled = false

    async function syncFromCloud() {
      setCloudSyncing(true)
      const cloud = await fetchCloudWorkoutData()
      if (cancelled) return

      if (!cloud) {
        setCloudSynced(true)
        setCloudSyncing(false)
        return
      }

      const hasCloudData =
        cloud.sessions.length > 0 || cloud.menuTemplates.length > 0

      skipNextCloudSave.current = true

      if (hasCloudData) {
        setSessions(dedupeSessions(cloud.sessions))
        setMenuTemplates(cloud.menuTemplates)
      } else {
        const localSessions = loadJson(STORAGE_KEYS.sessions, sessions)
        const localMenus = loadJson(STORAGE_KEYS.menuTemplates, menuTemplates)
        await uploadCloudWorkoutData(localSessions, localMenus)
      }

      setCloudSynced(true)
      setCloudSyncing(false)
    }

    void syncFromCloud()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authStatus, isAuthenticated, authSession?.user?.id])

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !cloudSynced) return
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false
      return
    }

    const timer = window.setTimeout(() => {
      void uploadCloudWorkoutData(sessionsForApp, menuTemplates)
    }, 800)

    return () => window.clearTimeout(timer)
  }, [sessionsForApp, menuTemplates, hydrated, isAuthenticated, cloudSynced])

  useEffect(() => {
    if (!hydrated) return
    if (activeRun) saveJson(STORAGE_KEYS.activeRun, activeRun)
    else localStorage.removeItem(STORAGE_KEYS.activeRun)
  }, [activeRun, hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (lastMenuId) localStorage.setItem(STORAGE_KEYS.lastMenuId, lastMenuId)
    else localStorage.removeItem(STORAGE_KEYS.lastMenuId)
  }, [lastMenuId, hydrated])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.activeSessionId, activeSessionId)
  }, [activeSessionId, hydrated])

  const getSession = useCallback(
    (id: string) => sessionsForApp.find(s => s.id === id),
    [sessionsForApp],
  )

  const getActiveSession = useCallback(() => {
    if (activeSessionId === 'new') {
      return sessionsForApp.find(s => s.status === 'active' && s.id.startsWith('session-'))
    }
    return sessionsForApp.find(s => s.id === activeSessionId)
  }, [sessionsForApp, activeSessionId])

  const setActiveSessionId = useCallback((id: string) => {
    setActiveSessionIdState(id)
  }, [])

  const updateSession = useCallback((session: Session) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = session
        return dedupeSessions(next)
      }
      return dedupeSessions([session, ...prev])
    })
  }, [])

  const createSession = useCallback((name?: string) => {
    let result = newSessionFromTemplate(name)
    setSessions(prev => {
      if (!name) {
        const active = prev.find(
          s => s.status === 'active' && s.id.startsWith('session-'),
        )
        if (active) {
          result = active
          return prev
        }
      }
      if (prev.some(s => s.id === result.id)) return prev
      return dedupeSessions([result, ...prev])
    })
    setActiveSessionIdState(result.id)
    return result
  }, [])

  const ensureSession = useCallback((id: string): Session => {
    if (id === 'new') {
      const existing = sessions.find(s => s.status === 'active')
      if (existing) return existing
      return createSession()
    }
    const found = sessions.find(s => s.id === id)
    if (found) return found
    const session = { ...newSessionFromTemplate(), id }
    setSessions(prev => {
      const existing = prev.find(s => s.id === id)
      if (existing) return prev
      return dedupeSessions([session, ...prev])
    })
    return session
  }, [sessions, createSession])

  const saveMenuTemplate = useCallback((template: WorkoutMenuTemplate) => {
    setMenuTemplates(prev => {
      const idx = prev.findIndex(m => m.id === template.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = template
        return next
      }
      return [template, ...prev]
    })
  }, [])

  const deleteMenuTemplate = useCallback((id: string) => {
    if (id === HYROX_OFFICIAL_MENU_ID) return
    setMenuTemplates(prev => prev.filter(m => m.id !== id))
  }, [])

  const duplicateMenuTemplate = useCallback((id: string, newName?: string) => {
    const src = menuTemplates.find(m => m.id === id)
    if (!src) return null
    const copy = createMenuTemplate(
      newName ?? `${src.name}（コピー）`,
      cloneSteps(src.steps),
      src.source === 'hyrox_official' ? 'custom' : src.source,
    )
    setMenuTemplates(prev => [copy, ...prev])
    return copy
  }, [menuTemplates])

  const getLastUsedMenu = useCallback((): WorkoutMenuTemplate | null => {
    if (lastMenuId) {
      const byId = menuTemplates.find(m => m.id === lastMenuId)
      if (byId) return byId
    }
    const sorted = [...menuTemplates].sort((a, b) => {
      const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0
      const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0
      return tb - ta
    })
    return sorted[0] ?? null
  }, [menuTemplates, lastMenuId])

  const setLastUsedMenu = useCallback((menuId: string) => {
    setLastMenuIdState(menuId)
    setMenuTemplates(prev =>
      prev.map(m =>
        m.id === menuId ? { ...m, lastUsedAt: new Date().toISOString() } : m,
      ),
    )
  }, [])

  const syncMenuToSession = useCallback((sessionId: string, steps: LapStep[]) => {
    const session = ensureSession(sessionId)
    updateSession({ ...session, plannedMenu: cloneSteps(steps) })
  }, [ensureSession, updateSession])

  const applyRunToSession = useCallback((run: ActiveTimerRun, finalize = false) => {
    const session = ensureSession(run.sessionId)
    let updated = applyLapsToSession(session, run)
    updated = { ...updated, plannedMenu: cloneSteps(run.steps), linkedTimerRunId: run.id }
    if (finalize) {
      updated = appendLapSummaryToNote(updated, run)
      updated = { ...updated, status: 'completed' }
    }
    updateSession(updated)
  }, [ensureSession, updateSession])

  const startTimerRun = useCallback((
    sessionId: string,
    steps: LapStep[],
    menuId?: string,
  ): ActiveTimerRun => {
    const session = ensureSession(sessionId)
    const snapshot = cloneSteps(steps)
    syncMenuToSession(session.id, snapshot)
    if (menuId) setLastUsedMenu(menuId)

    const run: ActiveTimerRun = {
      id: `run-${Date.now()}`,
      sessionId: session.id,
      menuId,
      steps: snapshot,
      status: 'running',
      currentStepIndex: 0,
      laps: [],
      startedAt: new Date().toISOString(),
      elapsedMs: 0,
      lapAtMs: 0,
    }
    setActiveRun(run)
    setActiveSessionIdState(session.id)
    updateSession({ ...session, plannedMenu: snapshot, linkedTimerRunId: run.id })
    return run
  }, [ensureSession, syncMenuToSession, setLastUsedMenu, updateSession])

  const pauseTimerRun = useCallback(() => {
    setActiveRun(prev => {
      if (!prev || prev.status !== 'running') return prev
      return { ...prev, status: 'paused' }
    })
  }, [])

  const resumeTimerRun = useCallback(() => {
    setActiveRun(prev => {
      if (!prev || prev.status !== 'paused') return prev
      return { ...prev, status: 'running' }
    })
  }, [])

  const tickTimer = useCallback((elapsedMs: number) => {
    setActiveRun(prev => {
      if (!prev || prev.status !== 'running') return prev
      return { ...prev, elapsedMs }
    })
  }, [])

  const recordLap = useCallback(() => {
    setActiveRun(prev => {
      if (!prev || prev.status === 'completed') return prev
      const step = prev.steps[prev.currentStepIndex]
      if (!step) return prev

      const splitMs = prev.elapsedMs - prev.lapAtMs
      const lap = {
        id: `lap-${Date.now()}`,
        stepIndex: prev.currentStepIndex,
        step,
        splitMs: Math.max(0, splitMs),
        totalMs: prev.elapsedMs,
        recordedAt: new Date().toISOString(),
      }

      const nextIndex = prev.currentStepIndex + 1
      const isComplete = nextIndex >= prev.steps.length
      const updated: ActiveTimerRun = {
        ...prev,
        laps: [...prev.laps, lap],
        currentStepIndex: nextIndex,
        lapAtMs: prev.elapsedMs,
        status: isComplete ? 'completed' : prev.status,
        completedAt: isComplete ? new Date().toISOString() : prev.completedAt,
      }

      queueMicrotask(() => applyRunToSession(updated, isComplete))
      return updated
    })
  }, [applyRunToSession])

  const completeTimerRun = useCallback(() => {
    setActiveRun(prev => {
      if (!prev) return prev
      const updated: ActiveTimerRun = {
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }
      queueMicrotask(() => applyRunToSession(updated, true))
      return updated
    })
  }, [applyRunToSession])

  const resetTimerRun = useCallback(() => {
    setActiveRun(null)
  }, [])

  const startFromLastMenu = useCallback(() => {
    const menu = getLastUsedMenu()
    if (!menu) return null
    const session = createSession(`${menu.name} ${new Date().toLocaleDateString('ja-JP')}`)
    syncMenuToSession(session.id, menu.steps)
    setLastUsedMenu(menu.id)
    return { session, menu }
  }, [getLastUsedMenu, createSession, syncMenuToSession, setLastUsedMenu])

  const value = useMemo<WorkoutStoreValue>(() => ({
    hydrated,
    cloudSynced,
    cloudSyncing,
    sessions: sessionsForApp,
    menuTemplates,
    activeSessionId,
    activeRun,
    lastMenuId,
    getSession,
    getActiveSession,
    setActiveSessionId,
    createSession,
    updateSession,
    ensureSession,
    saveMenuTemplate,
    deleteMenuTemplate,
    duplicateMenuTemplate,
    getLastUsedMenu,
    setLastUsedMenu,
    syncMenuToSession,
    startTimerRun,
    pauseTimerRun,
    resumeTimerRun,
    recordLap,
    completeTimerRun,
    resetTimerRun,
    tickTimer,
    startFromLastMenu,
  }), [
    hydrated, cloudSynced, cloudSyncing, sessionsForApp, menuTemplates, activeSessionId, activeRun, lastMenuId,
    getSession, getActiveSession, setActiveSessionId, createSession, updateSession,
    ensureSession, saveMenuTemplate, deleteMenuTemplate, duplicateMenuTemplate,
    getLastUsedMenu, setLastUsedMenu, syncMenuToSession, startTimerRun,
    pauseTimerRun, resumeTimerRun, recordLap, completeTimerRun, resetTimerRun,
    tickTimer, startFromLastMenu,
  ])

  if (!hydrated || (isAuthenticated && !cloudSynced)) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center text-sm text-gray-500">
        {cloudSyncing ? 'クラウドから同期中...' : '読み込み中...'}
      </div>
    )
  }

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkoutStore() {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkoutStore must be used within WorkoutProvider')
  return ctx
}

export { HYROX_OFFICIAL_MENU_ID }
