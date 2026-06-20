'use client'

import { useState } from 'react'
import { ChevronRight, Dumbbell, Wind, Zap } from 'lucide-react'
import { mockSessions, countCompletedRows, type Session, type MainCategory } from '@/lib/data'
import BottomNav from '@/components/bottom-nav'
import SessionDetailSheet from '@/components/session-detail-sheet'

const categoryIcon: Record<MainCategory, React.ReactNode> = {
  筋トレ:         <Dumbbell size={13} />,
  有酸素:         <Wind size={13} />,
  ファンクショナル: <Zap size={13} />,
}

function detectCategories(session: Session): MainCategory[] {
  const cats = new Set<MainCategory>()
  session.blocks.forEach(b =>
    b.rows.forEach(r => {
      if (r.exerciseName.startsWith('HYROX')) cats.add('ファンクショナル')
      else if (['ロードラン', 'トレッドミルラン'].some(n => r.exerciseName.includes(n))) cats.add('有酸素')
      else cats.add('筋トレ')
    })
  )
  return Array.from(cats)
}

function formatDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function HistoryPage() {
  const [selected, setSelected] = useState<Session | null>(null)

  return (
    <div className="app-page">
      <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-sm border-b border-white/10 flex items-center h-12 px-4">
        <h1 className="text-sm font-semibold">履歴</h1>
      </div>

      <div className="px-4 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          {mockSessions.length}セッション
        </p>

        <div className="space-y-2">
          {mockSessions.map(session => {
            const cats = detectCategories(session)
            const sets = countCompletedRows(session)
            const allRows = session.blocks.flatMap(b => b.rows)

            return (
              <button
                key={session.id}
                onClick={() => setSelected(session)}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5 text-left hover:bg-[#222] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{formatDateJP(session.date)}</p>
                    <p className="text-sm font-semibold">{session.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    {session.blocks.length}ブロック · {sets}セット完了
                  </span>
                  <div className="flex items-center gap-1">
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
              </button>
            )
          })}
        </div>
      </div>

      <SessionDetailSheet
        session={selected}
        open={!!selected}
        onOpenChange={open => !open && setSelected(null)}
      />

      <BottomNav />
    </div>
  )
}
