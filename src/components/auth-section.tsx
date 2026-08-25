'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Cloud, CloudOff, LogIn, LogOut } from 'lucide-react'

export default function AuthSection() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isLoggedIn = status === 'authenticated' && session?.user

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3 text-sm text-gray-500">
        アカウント情報を確認中...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <CloudOff size={18} className="text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">クラウド同期（未ログイン）</p>
            <p className="text-xs text-gray-500 mt-1">
              ログインすると Neon に記録が保存され、端末を替えても復元できます
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <LogIn size={16} />
          Google でログイン
        </button>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = session.user

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="w-10 h-10 rounded-full border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#252525] border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
            {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name ?? 'ユーザー'}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-green-400">
        <Cloud size={14} />
        Neon に自動同期中
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 bg-[#252525] hover:bg-[#2a2a2a] border border-white/10 text-sm rounded-lg px-4 py-2.5 transition-colors"
      >
        <LogOut size={16} />
        ログアウト
      </button>
    </div>
  )
}
