'use client'

import { useEffect, useRef, useState } from 'react'
import SessionEditor from '@/components/session-editor'
import { useWorkoutStore } from '@/lib/workout-store'

export default function TrainingPane({
  sessionId,
  onComplete,
  onSessionResolved,
  onStartTimer,
}: {
  sessionId: string
  onComplete?: () => void
  onSessionResolved?: (sessionId: string) => void
  onStartTimer?: () => void
}) {
  const { createSession, ensureSession, setActiveSessionId } = useWorkoutStore()
  const [resolvedId, setResolvedId] = useState(sessionId)
  const createdRef = useRef(false)

  useEffect(() => {
    if (sessionId === 'new') {
      if (!createdRef.current) {
        const session = createSession()
        createdRef.current = true
        setResolvedId(session.id)
        setActiveSessionId(session.id)
        onSessionResolved?.(session.id)
      }
    } else {
      ensureSession(sessionId)
      setResolvedId(sessionId)
      setActiveSessionId(sessionId)
      createdRef.current = false
    }
  }, [sessionId, createSession, ensureSession, setActiveSessionId, onSessionResolved])

  return (
    <SessionEditor
      key={resolvedId}
      sessionId={resolvedId}
      embedded
      onComplete={onComplete}
      onStartTimer={onStartTimer}
    />
  )
}
