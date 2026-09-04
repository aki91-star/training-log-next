'use client'

import { useEffect, useState } from 'react'
import { Download, Share, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())

    if (isIos() && !isStandalone()) {
      setShowIosHelp(true)
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setInstalled(true)
      setInstallEvent(null)
      setShowIosHelp(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstallEvent(null)
    }
  }

  if (installed) {
    return (
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5">
        <div className="flex items-start gap-3">
          <Smartphone size={18} className="text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">ホーム画面に追加済み</p>
            <p className="text-xs text-gray-500 mt-0.5">アイコンからアプリのように起動できます</p>
          </div>
        </div>
      </div>
    )
  }

  if (installEvent) {
    return (
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5 space-y-3">
        <div className="flex items-start gap-3">
          <Download size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">ホーム画面に追加</p>
            <p className="text-xs text-gray-500 mt-0.5">ブラウザではなく、アイコンから起動できます</p>
          </div>
        </div>
        <Button type="button" onClick={handleInstall} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          アプリをインストール
        </Button>
      </div>
    )
  }

  if (showIosHelp) {
    return (
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5 space-y-2">
        <div className="flex items-start gap-3">
          <Share size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">iPhone / iPad でホーム画面に追加</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Safari の共有ボタン（□↑）から「ホーム画面に追加」を選ぶと、アイコンから起動できます。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Smartphone size={18} className="text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm">ホーム画面に追加</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Chrome ならメニュー（⋮）から「アプリをインストール」または「ホーム画面に追加」を選んでください。
          </p>
        </div>
      </div>
    </div>
  )
}
