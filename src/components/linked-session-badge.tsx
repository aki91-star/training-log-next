'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useWorkoutStore } from '@/lib/workout-store'

export default function LinkedSessionBadge({
  sessionId,
  onOpenSession,
}: {
  sessionId?: string
  onOpenSession?: (sessionId: string) => void
}) {
  const { getSession, activeSessionId } = useWorkoutStore()
  const id = sessionId ?? activeSessionId
  const session = id && id !== 'new' ? getSession(id) : undefined

  if (!session) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2 text-xs text-yellow-200">
        連携セッション未選択 — 計測開始時に新規セッションを作成します
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">連携中</p>
        <p className="text-sm font-semibold truncate">{session.name}</p>
      </div>
      {onOpenSession ? (
        <button
          type="button"
          onClick={() => onOpenSession(session.id)}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 shrink-0 ml-2"
        >
          記録 <ExternalLink size={12} />
        </button>
      ) : (
        <Link
          href={`/?pane=training&session=${session.id}`}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 shrink-0 ml-2"
        >
          記録 <ExternalLink size={12} />
        </Link>
      )}
    </div>
  )
}
