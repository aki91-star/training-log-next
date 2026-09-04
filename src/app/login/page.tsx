'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import AppLogo from '@/components/app-logo'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const error = searchParams.get('error')

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-4">
          <AppLogo size="lg" showName={false} className="justify-center" />
          <p className="text-sm text-gray-500">
            Google アカウントでログインすると、記録が Neon に同期されます
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            ログインに失敗しました。設定を確認してください。
          </p>
        )}

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
        >
          <GoogleIcon />
          Google でログイン
        </button>

        <p className="text-xs text-gray-600 text-center">
          ログインしなくても端末内の localStorage で利用できます
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.203 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.659 0 5.062 1.035 6.863 2.723l6.062-6.062C33.891 9.626 29.139 8 24 8 14.059 8 6 16.059 6 26s8.059 18 18 18 18-8.059 18-18c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6 26c0-1.657.284-3.247.795-4.728L13.857 26.7C15.214 30.799 19.308 34 24 34c2.659 0 5.062-1.035 6.863-2.723l6.062 6.062C33.891 42.374 29.139 44 24 44 14.059 44 6 35.941 6 26z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C8.138 38.672 15.522 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-sm text-gray-500">読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  )
}
