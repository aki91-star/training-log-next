import { Suspense } from 'react'
import AppWorkspace from '@/components/app-workspace'

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">読み込み中...</div>}>
      <AppWorkspace initialPane="history" />
    </Suspense>
  )
}
