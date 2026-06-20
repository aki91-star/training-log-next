'use client'

import Link from 'next/link'
import { TrendingUp, Pencil } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  calcEstimatedRM, formatTime, formatDistance,
  type Session,
} from '@/lib/data'

function formatDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function SessionDetailSheet({
  session,
  open,
  onOpenChange,
}: {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-[#1a1a1a] border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto px-0">
        {session && (
          <>
            <SheetHeader className="px-4 pb-3 border-b border-white/10">
              <p className="text-xs text-gray-500">{formatDateJP(session.date)}</p>
              <SheetTitle className="text-white text-left">{session.name}</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-4 pb-6">
              {session.blocks.map((block, idx) => (
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
                            {row.metrics.weight != null && <span>{row.metrics.weight}kg</span>}
                            {row.metrics.reps != null && <span>× {row.metrics.reps}回</span>}
                            {row.metrics.distance != null && <span>{formatDistance(row.metrics.distance)}</span>}
                            {row.metrics.time != null && <span>{formatTime(row.metrics.time)}</span>}
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
              <Link
                href={`/session/${session.id}`}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-medium py-3 rounded-xl transition-colors"
              >
                <Pencil size={16} />
                セッションを開く
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
