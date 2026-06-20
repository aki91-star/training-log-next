'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, ArrowLeft, Trash2, Search, X, ChevronDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  mockSessions, exerciseMaster, calcEstimatedRM,
  type ExerciseRow, type BlockType, type Session,
  type ExerciseMaster, type MainCategory, type SubCategory,
} from '@/lib/data'

// ===== 定数 =====

const BLOCK_TYPE_CLS: Record<BlockType, string> = {
  '単体':           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'スーパーセット': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'サーキット':     'bg-green-500/20 text-green-300 border-green-500/30',
  'インターバル':   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}
const BLOCK_TYPES: BlockType[] = ['単体', 'スーパーセット', 'サーキット', 'インターバル']
const MAIN_CATS: MainCategory[] = ['筋トレ', '有酸素', 'ファンクショナル']
const SUB_CATS: Record<MainCategory, SubCategory[]> = {
  筋トレ:           ['胸', '背中', '肩', '脚', '腕', '腹筋'],
  有酸素:           ['ラン', 'バイク', 'クロストレーナー', 'ステアクライマー'],
  ファンクショナル: ['HYROX'],
}

/** 重量+回数 or 距離 が揃ったら完了扱い */
function isSetDone(row: ExerciseRow): boolean {
  const m = row.metrics
  if (m.weight && m.reps) return true
  if (m.distance) return true
  return false
}

function newSession(): Session {
  return {
    id: 'session-new',
    date: new Date().toISOString().slice(0, 10),
    name: '新規セッション',
    status: 'active',
    blocks: [],
  }
}

// ===== MetricField =====

function MetricField({
  label,
  unit,
  value = '',
  onChange,
  readOnly = false,
  displayValue,
  highlight = false,
}: {
  label: string
  unit: string
  value?: string
  onChange?: (v: string) => void
  readOnly?: boolean
  displayValue?: string | number | null
  highlight?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className="flex h-4 w-full items-end justify-center truncate text-center text-[9px] leading-none text-gray-500">
        {label}
      </span>
      {readOnly ? (
        <span
          className={`flex h-7 w-full items-center justify-center rounded-md text-xs font-bold tabular-nums ${
            highlight ? 'text-orange-400' : 'text-gray-600'
          }`}
        >
          {displayValue ?? '—'}
        </span>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder="—"
          className="h-7 w-full min-w-0 rounded-md border border-white/10 bg-[#252525] px-0.5 text-center text-xs tabular-nums text-white outline-none focus:border-orange-500/60"
        />
      )}
      <span className="text-[8px] leading-none text-gray-600">{unit}</span>
    </div>
  )
}

// ===== SetRow =====

function SetRow({
  row, setNum, prevRow, onDelete, onChange,
}: {
  row: ExerciseRow
  setNum: number
  prevRow?: ExerciseRow
  onDelete: () => void
  onChange: (m: ExerciseRow['metrics']) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const estRM = row.metrics.weight && row.metrics.reps
    ? calcEstimatedRM(row.metrics.weight, row.metrics.reps) : null

  const m = row.metrics

  return (
    <>
      <div className="px-2.5 py-3.5 border-b border-white/8 last:border-0">
        {/* セット番号 + 前セット反映 + 削除 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold">{setNum}セット目</span>
          {prevRow && (
            <button
              onClick={() => onChange({ ...prevRow.metrics })}
              className="flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 transition-colors shrink-0"
            >
              <ArrowLeft size={11} />
              前セットを反映
            </button>
          )}
          <div className="flex-1 min-w-0" />
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* メトリクス + 推定1RM（6列固定・折り返しなし） */}
        <div className="grid grid-cols-6 gap-x-0.5 sm:gap-x-1">
          <MetricField label="重量" unit="kg"
            value={m.weight?.toString() ?? ''}
            onChange={v => onChange({ ...m, weight: v ? +v : undefined })} />
          <MetricField label="回数" unit="回"
            value={m.reps?.toString() ?? ''}
            onChange={v => onChange({ ...m, reps: v ? +v : undefined })} />
          <MetricField label="距離" unit="m"
            value={m.distance?.toString() ?? ''}
            onChange={v => onChange({ ...m, distance: v ? +v : undefined })} />
          <MetricField label="時間" unit="秒"
            value={m.time?.toString() ?? ''}
            onChange={v => onChange({ ...m, time: v ? +v : undefined })} />
          <MetricField label="RPE" unit="/10"
            value={m.rpe?.toString() ?? ''}
            onChange={v => onChange({ ...m, rpe: v ? +v : undefined })} />
          <MetricField label="推定1RM" unit="kg"
            readOnly
            displayValue={estRM}
            highlight={!!estRM} />
        </div>

        {/* メモ */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-500 shrink-0">メモ</span>
          <input
            type="text"
            value={m.note ?? ''}
            onChange={e => onChange({ ...m, note: e.target.value })}
            placeholder="メモを入力（任意）"
            className="flex-1 bg-[#252525] border border-white/8 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-orange-500/30 transition-colors"
          />
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">セットを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {setNum}セット目のデータが削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
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

// ===== ExerciseGroup =====

function ExerciseGroup({
  exerciseName, rows, onDelete, onChange, onCopy,
}: {
  exerciseName: string
  rows: ExerciseRow[]
  onDelete: (id: string) => void
  onChange: (id: string, m: ExerciseRow['metrics']) => void
  onCopy: () => void
}) {
  const [open, setOpen] = useState(true)
  const doneCount = rows.filter(isSetDone).length

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-1.5 px-3 py-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{exerciseName}</span>
        <span className="shrink-0 text-xs text-gray-500">{rows.length}セット</span>
        <button
          onClick={onCopy}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-gray-400 transition-colors hover:border-orange-500/30 hover:bg-orange-500/15 hover:text-orange-400"
        >
          <Plus size={12} strokeWidth={2.5} />
          追加
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-gray-600 hover:text-gray-400 transition-colors p-0.5"
        >
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* セット一覧 */}
      {open && (
        <div className="border-t border-white/8">
          {rows.map((row, idx) => (
            <SetRow
              key={row.id}
              row={row}
              setNum={idx + 1}
              prevRow={idx > 0 ? rows[idx - 1] : undefined}
              onDelete={() => onDelete(row.id)}
              onChange={m => onChange(row.id, m)}
            />
          ))}

          {/* フッター：完了カウント */}
          <div className="px-4 py-2 border-t border-white/5">
            <span className="text-[11px] text-gray-600">
              {doneCount}/{rows.length} セット完了
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== ExercisePicker =====

function ExercisePicker({ open, onSelect, onClose }: {
  open: boolean; onSelect: (ex: ExerciseMaster) => void; onClose: () => void
}) {
  const [selectedMain, setSelectedMain] = useState<MainCategory | null>(null)
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMain, setNewMain] = useState<MainCategory>('筋トレ')

  const filtered = exerciseMaster.filter(ex => {
    if (query) return ex.name.toLowerCase().includes(query.toLowerCase())
    if (selectedSub) return ex.subCategory === selectedSub
    if (selectedMain) return ex.mainCategory === selectedMain
    return true
  })

  function handleCreate() {
    if (!newName.trim()) return
    onSelect({
      id: `ex-custom-${Date.now()}`, name: newName.trim(),
      mainCategory: newMain, subCategory: SUB_CATS[newMain][0],
      metrics: ['weight', 'reps', 'note'],
      completionCondition: ['weight', 'reps'], progressMetric: 'estimatedRM',
    })
    setNewName(''); setShowCreate(false)
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="bg-[#1a1a1a] border-white/10 rounded-t-2xl flex flex-col p-0" style={{ maxHeight: '85vh' }}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 shrink-0" />

        <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-[#2a2a2a] border border-white/10 rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="種目名で検索..." autoFocus
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
            {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-500" /></button>}
          </div>
          <button onClick={() => setShowCreate(v => !v)} className="p-2 text-orange-400 hover:text-orange-300 shrink-0">
            <Plus size={20} />
          </button>
        </div>

        {showCreate && (
          <div className="mx-4 mb-3 p-3 bg-[#222] rounded-xl border border-white/10 shrink-0">
            <p className="text-xs text-gray-400 mb-2">新規作成</p>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="種目名を入力"
              className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none mb-2" />
            <div className="flex gap-1.5 mb-2">
              {MAIN_CATS.map(cat => (
                <button key={cat} onClick={() => setNewMain(cat)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${newMain === cat ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <button onClick={handleCreate} disabled={!newName.trim()}
              className="w-full bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold py-2 rounded-lg">
              作成して追加
            </button>
          </div>
        )}

        {!query && (
          <div className="px-4 shrink-0">
            <div className="flex gap-1.5 mb-2">
              {MAIN_CATS.map(cat => (
                <button key={cat}
                  onClick={() => { setSelectedMain(selectedMain === cat ? null : cat); setSelectedSub(null) }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMain === cat ? 'bg-orange-500 text-white' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {selectedMain && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SUB_CATS[selectedMain].map(sub => (
                  <button key={sub} onClick={() => setSelectedSub(selectedSub === sub ? null : sub)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${selectedSub === sub ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="overflow-y-auto px-4 pb-6">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 mb-2">見つかりません</p>
              <button onClick={() => setShowCreate(true)} className="text-sm text-orange-400 flex items-center gap-1 mx-auto">
                <Plus size={15} /> 「{query}」を新規作成
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(ex => (
                <button key={ex.id} onClick={() => onSelect(ex)}
                  className="w-full flex items-start gap-3 bg-[#222] hover:bg-[#2a2a2a] rounded-xl px-3 py-2.5 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-gray-500">{ex.mainCategory} · {ex.subCategory}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ===== SessionPage 本体 =====

export default function SessionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'

  const base = isNew ? newSession() : mockSessions.find(s => s.id === id) ?? newSession()
  const [session, setSession] = useState<Session>(base)
  const [pickerForBlock, setPickerForBlock] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  // ===== ハンドラ =====

  function deleteRow(rowId: string) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => ({ ...b, rows: b.rows.filter(r => r.id !== rowId) })),
    }))
  }

  function changeMetrics(rowId: string, metrics: ExerciseRow['metrics']) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => ({
        ...b,
        rows: b.rows.map(r => r.id === rowId ? { ...r, metrics } : r),
      })),
    }))
  }

  function copySet(blockId: string, exerciseId: string) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id !== blockId) return b
        const exRows = b.rows.filter(r => r.exerciseId === exerciseId)
        if (!exRows.length) return b
        const last = exRows[exRows.length - 1]
        const newRow: ExerciseRow = {
          id: `row-copy-${Date.now()}`,
          exerciseId: last.exerciseId, exerciseName: last.exerciseName,
          round: exRows.length + 1, order: b.rows.length + 1,
          status: 'draft', metrics: { ...last.metrics },
        }
        const lastIdx = b.rows.reduce((acc, r, i) => r.exerciseId === exerciseId ? i : acc, -1)
        const next = [...b.rows]
        next.splice(lastIdx + 1, 0, newRow)
        return { ...b, rows: next }
      }),
    }))
  }

  function addExercise(blockId: string, ex: ExerciseMaster) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id !== blockId) return b
        const sameEx = b.rows.filter(r => r.exerciseId === ex.id)
        const newRow: ExerciseRow = {
          id: `row-new-${Date.now()}`,
          exerciseId: ex.id, exerciseName: ex.name,
          round: sameEx.length + 1, order: b.rows.length + 1,
          status: 'draft', metrics: {},
        }
        return { ...b, rows: [...b.rows, newRow] }
      }),
    }))
    setPickerForBlock(null)
  }

  function addBlock(type: BlockType) {
    setSession(prev => ({
      ...prev,
      blocks: [...prev.blocks, {
        id: `block-new-${Date.now()}`, type,
        order: prev.blocks.length + 1, rows: [],
      }],
    }))
    setShowBlockPicker(false)
  }

  // ===== 集計 =====

  const allRows = session.blocks.flatMap(b => b.rows)
  const completedCount = allRows.filter(isSetDone).length
  const totalCount = allRows.length
  const progressPct = totalCount ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="app-page-session">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center h-12 px-2">
          <button onClick={() => router.back()} className="p-2 text-gray-400">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 px-2">
            <input type="text" value={session.name}
              onChange={e => setSession(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold text-center outline-none" />
          </div>
          <div className="w-10" />
        </div>

        {totalCount > 0 && (
          <div className="px-4 pb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>進捗</span>
              <span>{completedCount} / {totalCount} セット完了</span>
            </div>
            <Progress value={progressPct} className="h-1 bg-white/10 [&>div]:bg-orange-500" />
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* 日付・ステータス */}
        <div className="flex items-center gap-3">
          <input type="date" value={session.date}
            onChange={e => setSession(prev => ({ ...prev, date: e.target.value }))}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
          <span className="text-xs">
            {session.status === 'active'
              ? <span className="text-orange-400 font-medium">● 記録中</span>
              : <span className="text-green-400 font-medium">✓ 完了</span>}
          </span>
        </div>

        {/* ブロック一覧 */}
        {session.blocks.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Plus size={28} className="text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">ブロックを追加して記録を始めましょう</p>
          </div>
        ) : (
          session.blocks.map((block, idx) => {
            const order: string[] = []
            const groupMap: Record<string, ExerciseRow[]> = {}
            block.rows.forEach(r => {
              if (!groupMap[r.exerciseId]) { order.push(r.exerciseId); groupMap[r.exerciseId] = [] }
              groupMap[r.exerciseId].push(r)
            })

            return (
              <div key={block.id} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <span className="text-xs font-bold text-gray-600">Block {idx + 1}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold border ${BLOCK_TYPE_CLS[block.type]}`}>
                    {block.type}
                  </Badge>
                </div>

                {order.map(exId => (
                  <ExerciseGroup key={exId}
                    exerciseName={groupMap[exId][0].exerciseName}
                    rows={groupMap[exId]}
                    onDelete={deleteRow}
                    onChange={changeMetrics}
                    onCopy={() => copySet(block.id, exId)} />
                ))}

                <button onClick={() => setPickerForBlock(block.id)}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-white/15 rounded-xl py-2.5 text-xs text-gray-600 hover:border-orange-500/40 hover:text-orange-400 transition-colors">
                  <Plus size={13} /> 種目を追加
                </button>
              </div>
            )
          })
        )}

        <button onClick={() => setShowBlockPicker(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl py-3 text-sm text-gray-500 hover:border-orange-500/50 hover:text-orange-400 transition-colors">
          <Plus size={16} /> ブロックを追加
        </button>
      </div>

      {/* 完了ボタン */}
      <div className="app-fixed-bottom px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-3 bg-gradient-to-t from-[#111111] to-transparent">
        <button onClick={() => router.push('/')}
          className="w-full bg-[#1a1a1a] border border-white/15 font-bold py-4 rounded-2xl hover:bg-[#222] transition-colors">
          セッションを完了
        </button>
      </div>

      {/* 種目ピッカー */}
      <ExercisePicker
        open={pickerForBlock !== null}
        onSelect={ex => pickerForBlock && addExercise(pickerForBlock, ex)}
        onClose={() => setPickerForBlock(null)} />

      {/* ブロック種類ピッカー */}
      <Sheet open={showBlockPicker} onOpenChange={o => !o && setShowBlockPicker(false)}>
        <SheetContent side="bottom" className="bg-[#1e1e1e] border-white/10 rounded-t-2xl p-6 pb-10">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-sm font-bold mb-4">ブロックの種類を選択</h3>
          <div className="space-y-2">
            {BLOCK_TYPES.map(type => (
              <button key={type} onClick={() => addBlock(type)}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors">
                <Badge variant="outline" className={`text-xs font-semibold shrink-0 border ${BLOCK_TYPE_CLS[type]}`}>
                  {type}
                </Badge>
                <span className="text-sm text-gray-300">
                  {type === '単体' && '1種目を複数セット記録'}
                  {type === 'スーパーセット' && '複数種目を交互に実施'}
                  {type === 'サーキット' && '複数種目を周回'}
                  {type === 'インターバル' && '区間ごとの強度・時間を記録'}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
