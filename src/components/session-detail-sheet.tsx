'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Pencil, Trash2, ClipboardCopy } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  calcEstimatedRM, formatTime, formatDistance, isRowCompleted, isPersistableSession,
  hasTransferableStructure,
} from '@/lib/data'
import {
  BLOCK_TYPE_CLS,
  BLOCK_CONTAINER_CLS,
  getExerciseLetter,
  getExerciseOrder,
  groupRowsByRound,
} from '@/lib/block-styles'
import { useWorkoutStore } from '@/lib/workout-store'

function formatDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

export default function SessionDetailSheet({
  sessionId,
  open,
  onOpenChange,
  onTransferToRecording,
}: {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferToRecording?: (sessionId: string) => void
}) {
  const { getSession, updateSession, deleteSession } = useWorkoutStore()
  const session = sessionId ? getSession(sessionId) : null
  const [blockToDelete, setBlockToDelete] = useState<{ id: string; label: string } | null>(null)
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(false)

  function handleDeleteSession() {
    if (!session) return
    deleteSession(session.id)
    setConfirmDeleteSession(false)
    onOpenChange(false)
  }

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
                {session.blocks.map((block, idx) => {
                  const isSuperset = block.type === 'スーパーセット'
                  const exerciseOrder = getExerciseOrder(block.rows)
                  const letterMap = Object.fromEntries(exerciseOrder.map((id, i) => [id, getExerciseLetter(i)]))
                  const rounds = groupRowsByRound(block.rows)

                  return (
                  <div key={block.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500">Block {idx + 1}</span>
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${BLOCK_TYPE_CLS[block.type]}`}>
                        {block.type}
                      </Badge>
                      {isSuperset && exerciseOrder.length > 0 && (
                        <span className="text-[10px] text-purple-400/70">
                          {exerciseOrder.length}種目 · {rounds.length}ラウンド
                        </span>
                      )}
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

                    {isSuperset ? (
                      <div className={`rounded-xl border overflow-hidden mb-1 ${BLOCK_CONTAINER_CLS['スーパーセット'] ?? ''}`}>
                        {rounds.map(({ round, rows }) => (
                          <div key={round} className="border-b border-purple-500/15 last:border-b-0">
                            <div className="bg-purple-500/[0.07] px-3 py-1.5">
                              <span className="text-[11px] font-bold text-purple-300">ラウンド {round}</span>
                            </div>
                            <div className="space-y-1 p-2">
                              {rows.map(row => {
                                const completed = isRowCompleted(row)
                                const estRM = row.metrics.weight && row.metrics.reps
                                  ? calcEstimatedRM(row.metrics.weight, row.metrics.reps) : null
                                return (
                                  <div
                                    key={row.id}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm ${
                                      completed ? 'bg-[#1f1a2a]' : 'bg-[#1e1e1e] opacity-60'
                                    }`}
                                  >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-purple-500/20 text-[9px] font-bold text-purple-300">
                                      {letterMap[row.exerciseId]}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-xs">{row.exerciseName}</span>
                                      {!completed && (
                                        <span className="ml-2 text-[10px] text-yellow-500">下書き</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                                      {row.metrics.bodyweight && !row.metrics.weight && <span>自重</span>}
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
                      </div>
                    ) : (
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
                              {row.metrics.bodyweight && !row.metrics.weight && <span>自重</span>}
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
                    )}
                  </div>
                  )
                })}
                {hasTransferableStructure(session) && onTransferToRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      onTransferToRecording(session.id)
                      onOpenChange(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-orange-500/40 text-orange-300 font-medium py-3 rounded-xl transition-colors"
                  >
                    <ClipboardCopy size={16} />
                    記録に転記
                  </button>
                )}
                <Link
                  href={`/session/${session.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  <Pencil size={16} />
                  セッションを開く
                </Link>
                {session && !isPersistableSession(session) && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteSession(true)}
                    className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium py-3 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                    セッションを削除
                  </button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDeleteSession} onOpenChange={setConfirmDeleteSession}>
        <AlertDialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">セッションを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {session?.name} の記録が削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-red-500 hover:bg-red-400 text-white border-0"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
