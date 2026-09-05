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
import {
  DEFAULT_MONTHLY_GOAL_DAYS,
  exerciseMaster,
  isBuiltInExercise,
  isPersistableSession,
  mockSessions,
  type ExerciseMaster,
  type Session,
} from '@/lib/data'
import { getLocalDateString } from '@/lib/date-utils'
import {
  HYROX_OFFICIAL_MENU,
  HYROX_OFFICIAL_MENU_ID,
} from '@/lib/hyrox-official-menu'
import {
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
  exercises: 'training-log:exercises',
  activeRun: 'training-log:active-run',
  lastMenuId: 'training-log:last-menu-id',
  activeSessionId: 'training-log:active-session-id',
  monthlyGoalDays: 'training-log:monthly-goal-days',
  timerAlarmEnabled: 'training-log:timer-alarm-enabled',
  keepScreenOnEnabled: 'training-log:keep-screen-on-enabled',
  seeded: 'training-log:seeded-v1',
} as const

const DEFAULT_TIMER_ALARM_ENABLED = true
const DEFAULT_KEEP_SCREEN_ON_ENABLED = true

function clampMonthlyGoalDays(value: number): number {
  return Math.min(31, Math.max(1, Math.round(value)))
}

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
    date: getLocalDateString(),
    name: name ?? '新規セッション',
    status: 'active',
    blocks: [],
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

type WorkoutPreferences = {
  monthlyGoalDays: number
  timerAlarmEnabled?: boolean
  keepScreenOnEnabled?: boolean
  exercises?: ExerciseMaster[]
}

type WorkoutStoreValue = {
  hydrated: boolean
  cloudSynced: boolean
  cloudSyncing: boolean
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
  exercises: ExerciseMaster[]
  activeSessionId: string
  activeRun: ActiveTimerRun | null
  lastMenuId: string | null
  monthlyGoalDays: number
  timerAlarmEnabled: boolean
  keepScreenOnEnabled: boolean

  getSession: (id: string) => Session | undefined
  getActiveSession: () => Session | undefined
  setActiveSessionId: (id: string) => void

  createSession: (name?: string) => Session
  updateSession: (session: Session) => void
  deleteSession: (id: string) => void
  ensureSession: (id: string) => Session

  saveMenuTemplate: (template: WorkoutMenuTemplate) => void
  deleteMenuTemplate: (id: string) => void
  duplicateMenuTemplate: (id: string, newName?: string) => WorkoutMenuTemplate | null
  getLastUsedMenu: () => WorkoutMenuTemplate | null
  setLastUsedMenu: (menuId: string) => void

  saveExercise: (exercise: ExerciseMaster) => void
  deleteExercise: (id: string) => void

  syncMenuToSession: (sessionId: string, steps: LapStep[]) => void

  startTimerRun: (sessionId: string, steps: LapStep[], menuId?: string) => ActiveTimerRun
  pauseTimerRun: () => void
  resumeTimerRun: () => void
  recordLap: () => void
  completeTimerRun: () => void
  resetTimerRun: () => void
  tickTimer: (elapsedMs: number) => void

  startFromLastMenu: () => { session: Session; menu: WorkoutMenuTemplate } | null

  setMonthlyGoalDays: (days: number) => void
  setTimerAlarmEnabled: (enabled: boolean) => void
  setKeepScreenOnEnabled: (enabled: boolean) => void
}

const WorkoutContext = createContext<WorkoutStoreValue | null>(null)

async function fetchCloudWorkoutData(): Promise<{
  sessions: Session[]
  menuTemplates: WorkoutMenuTemplate[]
  preferences: WorkoutPreferences
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
  preferences: WorkoutPreferences,
): Promise<boolean> {
  try {
    const res = await fetch('/api/workout-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions,
        menuTemplates,
        preferences: {
          monthlyGoalDays: preferences.monthlyGoalDays,
          timerAlarmEnabled: preferences.timerAlarmEnabled,
          keepScreenOnEnabled: preferences.keepScreenOnEnabled,
          exercises: preferences.exercises,
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

function propagateExerciseName(
  sessions: Session[],
  exerciseId: string,
  name: string,
): Session[] {
  return sessions.map(session => ({
    ...session,
    blocks: session.blocks.map(block => ({
      ...block,
      rows: block.rows.map(row =>
        row.exerciseId === exerciseId ? { ...row, exerciseName: name } : row,
      ),
    })),
  }))
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { data: authSession, status: authStatus } = useSession()
  const isAuthenticated = authStatus === 'authenticated' && Boolean(authSession?.user)

  const [hydrated, setHydrated] = useState(false)
  const [cloudSynced, setCloudSynced] = useState(false)
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [draftSessions, setDraftSessions] = useState<Record<string, Session>>({})
  const [menuTemplates, setMenuTemplates] = useState<WorkoutMenuTemplate[]>([])
  const [exercises, setExercises] = useState<ExerciseMaster[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState('new')
  const [activeRun, setActiveRun] = useState<ActiveTimerRun | null>(null)
  const [lastMenuId, setLastMenuIdState] = useState<string | null>(null)
  const [monthlyGoalDays, setMonthlyGoalDaysState] = useState(DEFAULT_MONTHLY_GOAL_DAYS)
  const [timerAlarmEnabled, setTimerAlarmEnabledState] = useState(DEFAULT_TIMER_ALARM_ENABLED)
  const [keepScreenOnEnabled, setKeepScreenOnEnabledState] = useState(DEFAULT_KEEP_SCREEN_ON_ENABLED)
  const skipNextCloudSave = useRef(false)
  const sessionsRef = useRef(sessions)
  const draftSessionsRef = useRef(draftSessions)
  const sessionsForApp = useMemo(() => dedupeSessions(sessions), [sessions])

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  useEffect(() => {
    draftSessionsRef.current = draftSessions
  }, [draftSessions])

  const findActiveSession = useCallback((): Session | undefined => {
    const today = getLocalDateString()
    const fromSessions = sessionsRef.current.find(
      s => s.status === 'active' && s.id.startsWith('session-') && s.date === today,
    )
    if (fromSessions) return fromSessions
    return Object.values(draftSessionsRef.current).find(
      s => s.status === 'active' && s.id.startsWith('session-') && s.date === today,
    )
  }, [])

  useEffect(() => {
    const seeded = localStorage.getItem(STORAGE_KEYS.seeded)
    if (!seeded) {
      const initial = seedInitialState()
      saveJson(STORAGE_KEYS.sessions, initial.sessions)
      saveJson(STORAGE_KEYS.menuTemplates, initial.menuTemplates)
      saveJson(STORAGE_KEYS.exercises, exerciseMaster)
      localStorage.setItem(STORAGE_KEYS.seeded, '1')
      setSessions(dedupeSessions(initial.sessions.filter(isPersistableSession)))
      setMenuTemplates(initial.menuTemplates)
      setExercises(exerciseMaster)
    } else {
      setSessions(dedupeSessions(
        loadJson(STORAGE_KEYS.sessions, mockSessions).filter(isPersistableSession),
      ))
      setMenuTemplates(loadJson(STORAGE_KEYS.menuTemplates, [HYROX_OFFICIAL_MENU]))
      setExercises(loadJson(STORAGE_KEYS.exercises, exerciseMaster))
    }
    setActiveRun(loadJson<ActiveTimerRun | null>(STORAGE_KEYS.activeRun, null))
    setLastMenuIdState(localStorage.getItem(STORAGE_KEYS.lastMenuId))
    setActiveSessionIdState(
      localStorage.getItem(STORAGE_KEYS.activeSessionId) ?? 'new',
    )
    setMonthlyGoalDaysState(
      clampMonthlyGoalDays(
        loadJson(STORAGE_KEYS.monthlyGoalDays, DEFAULT_MONTHLY_GOAL_DAYS),
      ),
    )
    setTimerAlarmEnabledState(
      loadJson(STORAGE_KEYS.timerAlarmEnabled, DEFAULT_TIMER_ALARM_ENABLED),
    )
    setKeepScreenOnEnabledState(
      loadJson(STORAGE_KEYS.keepScreenOnEnabled, DEFAULT_KEEP_SCREEN_ON_ENABLED),
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
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.exercises, exercises)
  }, [exercises, hydrated, isAuthenticated, cloudSynced])

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
        cloud.sessions.length > 0
        || cloud.menuTemplates.length > 0
        || (cloud.preferences?.exercises?.length ?? 0) > 0

      skipNextCloudSave.current = true

      if (hasCloudData) {
        setSessions(dedupeSessions(cloud.sessions.filter(isPersistableSession)))
        setMenuTemplates(cloud.menuTemplates)
        if (cloud.preferences?.exercises?.length) {
          setExercises(cloud.preferences.exercises)
        }
        setMonthlyGoalDaysState(
          clampMonthlyGoalDays(
            cloud.preferences?.monthlyGoalDays ?? DEFAULT_MONTHLY_GOAL_DAYS,
          ),
        )
        if (typeof cloud.preferences?.timerAlarmEnabled === 'boolean') {
          setTimerAlarmEnabledState(cloud.preferences.timerAlarmEnabled)
        }
        if (typeof cloud.preferences?.keepScreenOnEnabled === 'boolean') {
          setKeepScreenOnEnabledState(cloud.preferences.keepScreenOnEnabled)
        }
      } else {
        const localSessions = loadJson(STORAGE_KEYS.sessions, sessions)
          .filter(isPersistableSession)
        const localMenus = loadJson(STORAGE_KEYS.menuTemplates, menuTemplates)
        const localExercises = loadJson(STORAGE_KEYS.exercises, exercises)
        const localMonthlyGoalDays = clampMonthlyGoalDays(
          loadJson(STORAGE_KEYS.monthlyGoalDays, DEFAULT_MONTHLY_GOAL_DAYS),
        )
        const localTimerAlarmEnabled = loadJson(
          STORAGE_KEYS.timerAlarmEnabled,
          DEFAULT_TIMER_ALARM_ENABLED,
        )
        const localKeepScreenOnEnabled = loadJson(
          STORAGE_KEYS.keepScreenOnEnabled,
          DEFAULT_KEEP_SCREEN_ON_ENABLED,
        )
        await uploadCloudWorkoutData(localSessions, localMenus, {
          monthlyGoalDays: localMonthlyGoalDays,
          timerAlarmEnabled: localTimerAlarmEnabled,
          keepScreenOnEnabled: localKeepScreenOnEnabled,
          exercises: localExercises,
        })
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
      void uploadCloudWorkoutData(sessionsForApp, menuTemplates, {
        monthlyGoalDays,
        timerAlarmEnabled,
        keepScreenOnEnabled,
        exercises,
      })
    }, 800)

    return () => window.clearTimeout(timer)
  }, [
    sessionsForApp,
    menuTemplates,
    exercises,
    monthlyGoalDays,
    timerAlarmEnabled,
    keepScreenOnEnabled,
    hydrated,
    isAuthenticated,
    cloudSynced,
  ])

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

  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.monthlyGoalDays, monthlyGoalDays)
  }, [monthlyGoalDays, hydrated, isAuthenticated, cloudSynced])

  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.timerAlarmEnabled, timerAlarmEnabled)
  }, [timerAlarmEnabled, hydrated, isAuthenticated, cloudSynced])

  useEffect(() => {
    if (!hydrated) return
    if (isAuthenticated && !cloudSynced) return
    saveJson(STORAGE_KEYS.keepScreenOnEnabled, keepScreenOnEnabled)
  }, [keepScreenOnEnabled, hydrated, isAuthenticated, cloudSynced])

  const getSession = useCallback(
    (id: string) => sessionsForApp.find(s => s.id === id) ?? draftSessions[id],
    [sessionsForApp, draftSessions],
  )

  const getActiveSession = useCallback(() => {
    if (activeSessionId === 'new') return findActiveSession()
    return getSession(activeSessionId)
  }, [activeSessionId, findActiveSession, getSession])

  const setActiveSessionId = useCallback((id: string) => {
    setActiveSessionIdState(id)
  }, [])

  const updateSession = useCallback((session: Session) => {
    if (isPersistableSession(session)) {
      setDraftSessions(prev => {
        if (!(session.id in prev)) return prev
        const next = { ...prev }
        delete next[session.id]
        return next
      })
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === session.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = session
          return dedupeSessions(next)
        }
        return dedupeSessions([session, ...prev])
      })
      return
    }

    setSessions(prev => prev.filter(s => s.id !== session.id))
    setDraftSessions(prev => ({ ...prev, [session.id]: session }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    setDraftSessions(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setActiveSessionIdState(current => (current === id ? 'new' : current))
  }, [])

  const createSession = useCallback((name?: string) => {
    if (!name) {
      const active = findActiveSession()
      if (active) {
        setActiveSessionIdState(active.id)
        return active
      }
    }

    const result = newSessionFromTemplate(name)
    setDraftSessions(prev => {
      const next: Record<string, Session> = {}
      for (const [id, session] of Object.entries(prev)) {
        if (isPersistableSession(session)) next[id] = session
      }
      next[result.id] = result
      return next
    })
    setActiveSessionIdState(result.id)
    return result
  }, [findActiveSession])

  const ensureSession = useCallback((id: string): Session => {
    if (id === 'new') {
      const active = findActiveSession()
      if (active) return active
      return createSession()
    }

    const fromStore = sessionsRef.current.find(s => s.id === id)
    if (fromStore) return fromStore

    const fromDraft = draftSessionsRef.current[id]
    if (fromDraft) return fromDraft

    const session = { ...newSessionFromTemplate(), id }
    setDraftSessions(prev => {
      if (prev[id]) return prev
      return { ...prev, [id]: session }
    })
    return session
  }, [createSession, findActiveSession])

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

  const saveExercise = useCallback((exercise: ExerciseMaster) => {
    setExercises(prev => {
      const existing = prev.find(e => e.id === exercise.id)
      if (existing && existing.name !== exercise.name) {
        queueMicrotask(() => {
          setSessions(s => propagateExerciseName(s, exercise.id, exercise.name))
          setDraftSessions(drafts => {
            const next: Record<string, Session> = {}
            for (const [id, session] of Object.entries(drafts)) {
              next[id] = propagateExerciseName([session], exercise.id, exercise.name)[0]
            }
            return next
          })
        })
      }
      const idx = prev.findIndex(e => e.id === exercise.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = exercise
        return next
      }
      return [exercise, ...prev]
    })
  }, [])

  const deleteExercise = useCallback((id: string) => {
    if (isBuiltInExercise(id)) return
    setExercises(prev => prev.filter(e => e.id !== id))
  }, [])

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

  const setMonthlyGoalDays = useCallback((days: number) => {
    setMonthlyGoalDaysState(clampMonthlyGoalDays(days))
  }, [])

  const setTimerAlarmEnabled = useCallback((enabled: boolean) => {
    setTimerAlarmEnabledState(enabled)
  }, [])

  const setKeepScreenOnEnabled = useCallback((enabled: boolean) => {
    setKeepScreenOnEnabledState(enabled)
  }, [])

  const value = useMemo<WorkoutStoreValue>(() => ({
    hydrated,
    cloudSynced,
    cloudSyncing,
    sessions: sessionsForApp,
    menuTemplates,
    exercises,
    activeSessionId,
    activeRun,
    lastMenuId,
    monthlyGoalDays,
    timerAlarmEnabled,
    keepScreenOnEnabled,
    getSession,
    getActiveSession,
    setActiveSessionId,
    createSession,
    updateSession,
    deleteSession,
    ensureSession,
    saveMenuTemplate,
    deleteMenuTemplate,
    duplicateMenuTemplate,
    getLastUsedMenu,
    setLastUsedMenu,
    saveExercise,
    deleteExercise,
    syncMenuToSession,
    startTimerRun,
    pauseTimerRun,
    resumeTimerRun,
    recordLap,
    completeTimerRun,
    resetTimerRun,
    tickTimer,
    startFromLastMenu,
    setMonthlyGoalDays,
    setTimerAlarmEnabled,
    setKeepScreenOnEnabled,
  }), [
    hydrated, cloudSynced, cloudSyncing, sessionsForApp, menuTemplates, exercises, activeSessionId, activeRun, lastMenuId,
    monthlyGoalDays, timerAlarmEnabled, keepScreenOnEnabled,
    getSession, getActiveSession, setActiveSessionId, createSession, updateSession,
    deleteSession, ensureSession, saveMenuTemplate, deleteMenuTemplate, duplicateMenuTemplate,
    getLastUsedMenu, setLastUsedMenu, saveExercise, deleteExercise, syncMenuToSession, startTimerRun,
    pauseTimerRun, resumeTimerRun, recordLap, completeTimerRun, resetTimerRun,
    tickTimer, startFromLastMenu, setMonthlyGoalDays, setTimerAlarmEnabled, setKeepScreenOnEnabled,
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
