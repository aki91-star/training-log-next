'use client'

import { useState } from 'react'
import { X, ChevronRight, Dumbbell, Wind, Zap, TrendingUp } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  mockSessions, countCompletedRows, calcEstimatedRM, formatTime, formatDistance,
  type Session, type MainCategory,
} from '@/lib/data'
import BottomNav from '@/components/bottom-nav'

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
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function HistoryPage() {
  const [selected, setSelected] = useState<Session | null>(null)

  return (
    <div className="min-h-screen pb-24">
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

      {/* セッション詳細シート */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent side="bottom" className="bg-[#1a1a1a] border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto px-0">
          {selected && (
            <>
              <SheetHeader className="px-4 pb-3 border-b border-white/10">
                <p className="text-xs text-gray-500">{formatDateJP(selected.date)}</p>
                <SheetTitle className="text-white text-left">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-4 pb-10">
                {selected.blocks.map((block, idx) => (
                  <div key={block.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500">Block {idx + 1}</span>
                      <Badge variant="outline" className="text-[10px] text-gray-400 border-white/15">
                        {block.type}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 pl-2 border-l border-white/8">
                      {block.rows.map(row => {
                        const estRM = row.metrics.weight && row.metrics.reps
                          ? calcEstimatedRM(row.metrics.weight, row.metrics.reps) : null
                        return (
                          <div
                            key={row.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              row.status === 'completed' ? 'bg-[#1f2a1f]' : 'bg-[#1e1e1e] opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs">{row.exerciseName}</span>
                              {row.status === 'draft' && (
                                <span className="ml-2 text-[10px] text-yellow-500">下書き</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                              {row.metrics.weight && <span>{row.metrics.weight}kg</span>}
                              {row.metrics.reps && <span>× {row.metrics.reps}回</span>}
                              {row.metrics.distance && <span>{formatDistance(row.metrics.distance)}</span>}
                              {row.metrics.time && <span>{formatTime(row.metrics.time)}</span>}
                              {estRM && (
                                <span className="text-orange-400 flex items-center gap-0.5">
                                  <TrendingUp size={11} />{estRM}kg
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
