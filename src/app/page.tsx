import Link from 'next/link'
import { Plus, ChevronRight, Dumbbell, Wind, Zap } from 'lucide-react'
import { mockSessions, countCompletedRows, type Session, type MainCategory } from '@/lib/data'
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    md:  `${d.getMonth() + 1}/${d.getDate()}`,
    day: '日月火水木金土'[d.getDay()],
  }
}

export default function Home() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const recentSessions = mockSessions.slice(0, 3)

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-8 pb-6">
        <p className="text-xs text-gray-500 mb-1">{todayStr}</p>
        <h1 className="text-2xl font-bold tracking-tight">Training Log</h1>
      </div>

      <div className="px-4 mb-8">
        <Link
          href="/session/new"
          className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
        >
          <Plus size={22} strokeWidth={2.5} />
          新規セッション開始
        </Link>
      </div>

      <div className="px-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          最近のセッション
        </h2>
        <div className="space-y-2">
          {recentSessions.map(session => {
            const { md, day } = formatDate(session.date)
            const categories = detectCategories(session)
            const sets = countCompletedRows(session)

            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3.5 hover:bg-[#222] active:bg-[#1e1e1e] transition-colors"
              >
                <div className="w-10 text-center shrink-0">
                  <span className="text-xs font-bold text-orange-400 leading-none block">{md}</span>
                  <span className="text-[10px] text-gray-500">({day})</span>
                </div>
                <div className="w-px h-8 bg-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{session.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{sets}セット</span>
                    <div className="flex items-center gap-1">
                      {categories.map(cat => (
                        <span key={cat} className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-white/8 rounded px-1.5 py-0.5">
                          {categoryIcon[cat]}{cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
