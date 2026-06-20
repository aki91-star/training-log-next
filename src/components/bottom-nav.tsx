'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Settings } from 'lucide-react'

const navItems = [
  { href: '/',         label: 'ホーム', icon: Home     },
  { href: '/history',  label: '履歴',   icon: History  },
  { href: '/settings', label: '設定',   icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="app-fixed-bottom bg-[#1a1a1a] border-t border-white/10 flex justify-around pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 px-6 text-xs transition-colors ${
              active ? 'text-orange-400' : 'text-gray-500'
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
