'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Dumbbell, Plus, Scale, PersonStanding, Wind, Zap } from 'lucide-react'
import HomeSummary from '@/components/home-summary'
import SessionDetailSheet from '@/components/session-detail-sheet'
import StatChartSheet, { type StatChartConfig } from '@/components/stat-chart-sheet'
import { useWorkoutStore } from '@/lib/workout-store'
import {
  aggregateMonthStats,
  countCompletedRows,
  type Session,
  type MainCategory,
} from '@/lib/data'
import { Badge } from '@/components/ui/badge'

const categoryIcon: Record<MainCategory, React.ReactNode> = {
  筋トレ: <Dumbbell size={13} />,
  有酸素: <Wind size={13} />,
  ファンクショナル: <Zap size={13} />,
}

function detectCategories(session: Session): MainCategory[] {
  const cats = new Set<MainCategory>()
  session.blocks.forEach(b =>
    b.rows.forEach(r => {
      if (r.exerciseName.startsWith('HYROX')) cats.add('ファンクショナル')
      else if (['ロードラン', 'トレッドミルラン'].some(n => r.exerciseName.includes(n))) cats.add('有酸素')
      else cats.add('筋トレ')
    }),
  )
  return Array.from(cats)
}

function formatDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function HistoryPane({
  onOpenSession,
  onStartNew,
  onTransferToRecording,
}: {
  onOpenSession: (sessionId: string) => void
  onStartNew: () => void
  onTransferToRecording?: (sessionId: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chartConfig, setChartConfig] = useState<StatChartConfig | null>(null)
  const today = useMemo(() => new Date(), [])
  const { sessions, monthlyGoalDays } = useWorkoutStore()

  const monthStats = useMemo(
    () => aggregateMonthStats(sessions, today.getFullYear(), today.getMonth()),
    [today, sessions],
  )

  const monthlyCards = [
    { icon: <Scale size={14} />, label: '月間総負荷', value: `${monthStats.tonnage.toFixed(1)} t`, config: { metric: 'tonnage' as const, period: 'month' as const, title: '月間総負荷', unit: 't', decimals: 1 } },
    { icon: <PersonStanding size={14} />, label: '月間有酸素', value: `${monthStats.cardioKm.toFixed(1)} km`, config: { metric: 'cardioKm' as const, period: 'month' as const, title: '月間有酸素距離', unit: 'km', decimals: 1 } },
    { icon: <Dumbbell size={14} />, label: '月間セット', value: `${monthStats.sets} sets`, config: { metric: 'sets' as const, period: 'month' as const, title: '月間セット数', unit: 'sets' } },
    { icon: <CalendarDaysIcon />, label: '月間セッション', value: `${monthStats.sessions} 回`, config: { metric: 'sessions' as const, period: 'month' as const, title: '月間セッション数', unit: '回' } },
  ]

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-3">
        {monthlyCards.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => setChartConfig(item.config)}
            className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3 text-left hover:bg-[#222] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <span className="text-orange-400">{item.icon}</span>
              <span className="text-[10px] uppercase tracking-wide">{item.label}</span>
            </div>
            <p className="text-base font-bold">{item.value}</p>
          </button>
        ))}
      </div>

      <HomeSummary
        today={today}
        compact
        sessions={sessions}
        monthlyGoalDays={monthlyGoalDays}
        onTransferToRecording={onTransferToRecording}
      />

      <div className="px-4 lg:px-3">
        <button
          type="button"
          onClick={onStartNew}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm py-3 rounded-xl transition-colors mb-4"
        >
          <Plus size={18} strokeWidth={2.5} />
          新規セッション開始
        </button>

        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          全 {sessions.length} セッション
        </p>

        <div className="space-y-2">
          {sessions.map(session => {
            const cats = detectCategories(session)
            const sets = countCompletedRows(session)
            const allRows = session.blocks.flatMap(b => b.rows)

            return (
              <div
                key={session.id}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3 text-left hover:bg-[#222] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(session.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedId(session.id)
                      }
                    }}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <p className="text-xs text-gray-500 mb-0.5">{formatDateJP(session.date)}</p>
                    <p className="text-sm font-semibold truncate">{session.name}</p>
                    {session.linkedTimerRunId && (
                      <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-300 mt-0.5">
                        ラップ計測
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {session.blocks.length}ブロック · {sets}セット
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {cats.map(cat => (
                          <span key={cat} className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-white/8 rounded px-1.5 py-0.5">
                            {categoryIcon[cat]}{cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 h-0.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: allRows.length > 0 ? `${(sets / allRows.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenSession(session.id)}
                      className="text-[10px] text-orange-400 border border-orange-500/30 rounded px-2 py-1 hover:bg-orange-500/10"
                    >
                      編集
                    </button>
                    <ChevronRight size={16} className="text-gray-600" aria-hidden />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <SessionDetailSheet
        sessionId={selectedId}
        open={!!selectedId}
        onOpenChange={open => !open && setSelectedId(null)}
        onTransferToRecording={onTransferToRecording}
      />

      <StatChartSheet
        config={chartConfig}
        sessions={sessions}
        refDate={today}
        open={!!chartConfig}
        onOpenChange={open => !open && setChartConfig(null)}
      />
    </div>
  )
}

function CalendarDaysIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
