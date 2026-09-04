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
  isMeasuring = false,
  className = '',
}: {
  active: AppPane
  onChange: (pane: AppPane) => void
  isMeasuring?: boolean
  className?: string
}) {
  return (
    <nav className={`app-pane-nav ${className}`}>
      {navItems.map(({ id, icon: Icon }) => {
        const isActive = active === id
        const showBadge = id === 'timer' && isMeasuring
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-label={showBadge ? `${PANE_LABELS[id]}（計測中）` : PANE_LABELS[id]}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              isActive ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="relative">
              <Icon size={22} />
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500" />
              )}
            </span>
            <span>{PANE_LABELS[id]}</span>
          </button>
        )
      })}
    </nav>
  )
}
