'use client'

import { CalendarDays, Dumbbell, Timer, Settings } from 'lucide-react'
import { type AppPane, PANE_LABELS } from '@/lib/panes'

const navItems: { id: AppPane; icon: typeof CalendarDays }[] = [
  { id: 'history', icon: CalendarDays },
  { id: 'training', icon: Dumbbell },
  { id: 'timer', icon: Timer },
  { id: 'settings', icon: Settings },
]

export default function PaneNav({
  active,
  onChange,
  className = '',
}: {
  active: AppPane
  onChange: (pane: AppPane) => void
  className?: string
}) {
  return (
    <nav className={`app-pane-nav ${className}`}>
      {navItems.map(({ id, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              isActive ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={22} />
            <span>{PANE_LABELS[id]}</span>
          </button>
        )
      })}
    </nav>
  )
}
