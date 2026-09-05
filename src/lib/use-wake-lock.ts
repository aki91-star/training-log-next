'use client'

import { useEffect, useRef } from 'react'

/** タイマー稼働中に画面が消灯しないよう Screen Wake Lock を維持する */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return
    }

    let cancelled = false

    async function acquire() {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        lockRef.current?.release().catch(() => {})
        lockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // 低電力モード・非対応ブラウザ等
      }
    }

    void acquire()

    function onVisibilityChange() {
      if (!cancelled && document.visibilityState === 'visible') {
        void acquire()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
