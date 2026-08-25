'use client'

import { useSession } from 'next-auth/react'

export default function UserAvatar() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 animate-pulse" />
    )
  }

  if (session?.user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={session.user.image}
        alt={session.user.name ?? 'ユーザー'}
        className="w-9 h-9 rounded-full border border-white/10 object-cover"
      />
    )
  }

  const initial = (session?.user?.name ?? session?.user?.email ?? 'N').slice(0, 1).toUpperCase()

  return (
    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
      {initial}
    </div>
  )
}
