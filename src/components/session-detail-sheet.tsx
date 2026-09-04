'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  calcEstimatedRM, formatTime, formatDistance, isRowCompleted,
} from '@/lib/data'
import { useWorkoutStore } from '@/lib/workout-store'

function formatDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function SessionDetailSheet({
  sessionId,
  open,
  onOpenChange,
}: {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { getSession, updateSession, deleteSession } = useWorkoutStore()
  const session = sessionId ? getSession(sessionId) : null
  const [blockToDelete, setBlockToDelete] = useState<{ id: string; label: string } | null>(null)

  function handleDeleteBlock() {
    if (!session || !blockToDelete) return

    const remaining = session.blocks.filter(b => b.id !== blockToDelete.id)
    if (remaining.length === 0) {
      deleteSession(session.id)
      onOpenChange(false)
    } else {
      updateSession({
        ...session,
        blocks: remaining.map((b, i) => ({ ...b, order: i + 1 })),
      })
    }
    setBlockToDelete(null)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="bg-[#1a1a1a] border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto px-0">
          {session && (
            <>
              <SheetHeader className="px-4 pb-3 border-b border-white/10">
                <p className="text-xs text-gray-500">{formatDateJP(session.date)}</p>
                <SheetTitle className="text-white text-left">{session.name}</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
                {session.blocks.map((block, idx) => (
                  <div key={block.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500">Block {idx + 1}</span>
                      <Badge variant="outline" className="text-[10px] text-gray-400 border-white/15">
                        {block.type}
                      </Badge>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => setBlockToDelete({ id: block.id, label: `Block ${idx + 1}` })}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        aria-label={`${block.type}（Block ${idx + 1}）を削除`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5 pl-2 border-l border-white/8">
                      {block.rows.map(row => {
                        const completed = isRowCompleted(row)
                        const estRM = row.metrics.weight && row.metrics.reps
                          ? calcEstimatedRM(row.metrics.weight, row.metrics.reps) : null
                        return (
                          <div
                            key={row.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              completed ? 'bg-[#1f2a1f]' : 'bg-[#1e1e1e] opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs">{row.exerciseName}</span>
                              {!completed && (
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

      <AlertDialog open={blockToDelete !== null} onOpenChange={open => !open && setBlockToDelete(null)}>
        <AlertDialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ブロックを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {blockToDelete?.label}（{session?.blocks.find(b => b.id === blockToDelete?.id)?.type}）の記録が削除されます。この操作は取り消せません。
              {session?.blocks.length === 1 && (
                <span className="block mt-2 text-yellow-500/90">
                  最後のブロックのため、セッション全体も削除されます。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlock}
              className="bg-red-500 hover:bg-red-400 text-white border-0"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
