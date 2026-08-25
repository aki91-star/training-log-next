'use client'

import { useMemo, useState } from 'react'
import { Dumbbell, Scale, PersonStanding, Zap } from 'lucide-react'
import SessionDetailSheet from '@/components/session-detail-sheet'
import {
  mockSessions,
  MONTHLY_GOAL_DAYS,
  aggregateWeekStats,
  getSessionsInWeek,
  getUniqueTrainingDatesInMonth,
  getSessionsOnDate,
  type Session,
} from '@/lib/data'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDelta(current: number, prev: number, decimals = 0): string {
  const diff = current - prev
  if (diff === 0) return '±0'
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(decimals)}`
}

function StatCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: string
}) {
  const isPositive = delta.startsWith('+')
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 text-gray-500 mb-2">
        <span className="text-orange-400">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className={`text-[11px] mt-1 ${isPositive ? 'text-orange-400' : 'text-gray-500'}`}>
        先週比 {delta}
      </p>
    </div>
  )
}

export default function HomeSummary({
  today = new Date(),
  compact = false,
  sessions: sessionsProp,
}: {
  today?: Date
  compact?: boolean
  sessions?: import('@/lib/data').Session[]
}) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [dayPicker, setDayPicker] = useState<Session[] | null>(null)

  const year = today.getFullYear()
  const month = today.getMonth()

  const sessions = sessionsProp ?? mockSessions

  const trainingDates = useMemo(
    () => getUniqueTrainingDatesInMonth(sessions, year, month),
    [sessions, year, month],
  )

  const monthDayCount = trainingDates.size

  const thisWeekStats = useMemo(
    () => aggregateWeekStats(getSessionsInWeek(sessions, today, 0)),
    [sessions, today],
  )
  const lastWeekStats = useMemo(
    () => aggregateWeekStats(getSessionsInWeek(sessions, today, -1)),
    [sessions, today],
  )

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const leadingBlanks = firstDay.getDay()
    const cells: (number | null)[] = Array(leadingBlanks).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  function dateStrFromDay(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function handleDayClick(day: number) {
    const dateStr = dateStrFromDay(day)
    const sessionsOnDay = getSessionsOnDate(sessions, dateStr)
    if (sessionsOnDay.length === 0) return
    if (sessionsOnDay.length === 1) {
      setSelectedSession(sessionsOnDay[0])
    } else {
      setDayPicker(sessionsOnDay)
    }
  }

  const goalProgress = Math.min(100, (monthDayCount / MONTHLY_GOAL_DAYS) * 100)

  return (
    <>
      <div className={`${compact ? 'px-3 lg:px-3' : 'px-4'} space-y-4 mb-6`}>
        {/* カレンダー */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</h2>
            <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/25 rounded-full px-2.5 py-0.5">
              {monthDayCount} days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-1">
            {WEEKDAYS.map((wd, i) => (
              <div key={`${wd}-${i}`} className="text-center text-[10px] text-gray-600 font-medium py-1">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {calendarCells.map((day, i) => {
              if (day === null) {
                return <div key={`blank-${i}`} className="h-9" />
              }
              const dateStr = dateStrFromDay(day)
              const hasTraining = trainingDates.has(dateStr)
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()

              return (
                <div key={dateStr} className="flex justify-center">
                  <button
                    type="button"
                    disabled={!hasTraining}
                    onClick={() => handleDayClick(day)}
                    aria-label={hasTraining ? `${month + 1}月${day}日のセッションを見る` : undefined}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all
                      ${hasTraining
                        ? 'bg-orange-500 text-white hover:bg-orange-400 active:scale-95 cursor-pointer'
                        : 'text-gray-600 cursor-default'}
                      ${isToday && !hasTraining ? 'ring-1 ring-white/20' : ''}
                      ${isToday && hasTraining ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-[#1a1a1a]' : ''}
                    `}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Monthly Archive</p>
              <p className="text-2xl font-bold">{monthDayCount} <span className="text-sm font-normal text-gray-500">days</span></p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Goal</p>
                <p className="text-xs text-gray-400">{monthDayCount} / {MONTHLY_GOAL_DAYS} days</p>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 週次サマリー 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Dumbbell size={14} />}
            label="今週のセット"
            value={`${thisWeekStats.sets} sets`}
            delta={formatDelta(thisWeekStats.sets, lastWeekStats.sets)}
          />
          <StatCard
            icon={<Scale size={14} />}
            label="総負荷量"
            value={`${thisWeekStats.tonnage.toFixed(1)} t`}
            delta={formatDelta(thisWeekStats.tonnage, lastWeekStats.tonnage, 1)}
          />
          <StatCard
            icon={<PersonStanding size={14} />}
            label="有酸素"
            value={`${thisWeekStats.cardioKm.toFixed(1)} km`}
            delta={formatDelta(thisWeekStats.cardioKm, lastWeekStats.cardioKm, 1)}
          />
          <StatCard
            icon={<Zap size={14} />}
            label="HYROX系"
            value={`${thisWeekStats.hyroxCount} time${thisWeekStats.hyroxCount !== 1 ? 's' : ''}`}
            delta={formatDelta(thisWeekStats.hyroxCount, lastWeekStats.hyroxCount)}
          />
        </div>
      </div>

      <SessionDetailSheet
        session={selectedSession}
        open={!!selectedSession}
        onOpenChange={open => !open && setSelectedSession(null)}
      />

      {dayPicker && (
        <div
          className="app-modal-overlay"
          onClick={() => setDayPicker(null)}
        >
          <div
            className="app-modal-sheet bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl p-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))]"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs text-gray-500 mb-3">この日のセッション</p>
            <div className="space-y-2">
              {dayPicker.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setDayPicker(null)
                    setSelectedSession(s)
                  }}
                  className="w-full text-left bg-[#222] border border-white/8 rounded-xl px-4 py-3 hover:bg-[#2a2a2a] transition-colors"
                >
                  <p className="text-sm font-semibold">{s.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
