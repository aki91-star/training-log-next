'use client'

import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SessionEditor from '@/components/session-editor'

function SessionPageInner() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  return (
    <SessionEditor
      sessionId={id}
      onBack={() => router.back()}
      onComplete={() => router.push('/?pane=history')}
    />
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">読み込み中...</div>}>
      <SessionPageInner />
    </Suspense>
  )
}
