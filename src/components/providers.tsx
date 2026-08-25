'use client'

import { SessionProvider } from 'next-auth/react'
import { WorkoutProvider } from '@/lib/workout-store'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WorkoutProvider>{children}</WorkoutProvider>
    </SessionProvider>
  )
}
