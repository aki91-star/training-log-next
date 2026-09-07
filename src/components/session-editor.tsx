'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeft, Trash2, Search, X, Repeat2, ChevronDown, Flag, History, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  mockSessions, calcEstimatedRM,
  deriveRowStatus, isRowCompleted,
  createExerciseMaster,
  decomposeTimeSeconds,
  composeTimeSeconds,
  formatTime,
  formatDistance,
  findPreviousExerciseHistory,
  MAIN_CATEGORIES,
  DEFAULT_SUB_CATEGORIES,
  formatExerciseCategoryLabel,
  hasSubCategoryGroups,
  type ExerciseRow, type BlockType, type Session,
  type ExerciseMaster, type MainCategory, type WorkBlock,
  type ExerciseHistorySnapshot,
} from '@/lib/data'
import { useWorkoutStore } from '@/lib/workout-store'
import { getLocalDateString } from '@/lib/date-utils'
import { formatMs } from '@/lib/format-time'
import { getLapRowKind, getLapRowLabel, isLapBlock } from '@/lib/lap-to-session'
import { cloneSteps, type LapStep } from '@/lib/workout-types'
import LapMenuBar from '@/components/lap-menu-bar'
import SessionStatusBar from '@/components/session-status-bar'
import {
  BLOCK_TYPE_CLS,
  BLOCK_CONTAINER_CLS,
  getExerciseLetter,
  getExerciseOrder,
  getMaxRound,
  groupRowsByExercise,
  groupRowsByRound,
} from '@/lib/block-styles'

// ===== 定数 =====

const BLOCK_TYPES: BlockType[] = ['単体', 'スーパーセット', 'サーキット', 'インターバル']

function newSession(): Session {
  return {
    id: 'session-new',
    date: getLocalDateString(),
    name: '新規セッション',
    status: 'active',
    blocks: [],
  }
}

// ===== MetricField =====

const METRICS_GRID_CLS =
  'grid grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,0.6fr)] gap-x-0.5 sm:gap-x-1'

const TIME_INPUT_CLS =
  'h-7 min-w-0 rounded-md border border-white/10 bg-[#252525] px-0 text-center text-[10px] tabular-nums text-white outline-none focus:border-orange-500/60'

function BodyweightField({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex w-7 shrink-0 flex-col items-center gap-0.5">
      <span className="flex h-4 items-end justify-center text-[9px] leading-none text-gray-500">
        自重
      </span>
      <label className="flex h-7 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-[#252525] accent-blue-500"
        />
      </label>
      <span className="text-[8px] leading-none text-transparent select-none" aria-hidden="true">—</span>
    </div>
  )
}

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
          className={`flex h-7 w-full items-center justify-center rounded-md text-[10px] font-bold tabular-nums ${
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

function TimeField({
  value,
  onChange,
}: {
  value?: number
  onChange: (seconds: number | undefined) => void
}) {
  const [parts, setParts] = useState(() => decomposeTimeSeconds(value))
  const lastEmitted = useRef<number | undefined>(value)

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setParts(decomposeTimeSeconds(value))
      lastEmitted.current = value
    }
  }, [value])

  function commit(next: { h: string; m: string; s: string }) {
    setParts(next)
    const seconds = composeTimeSeconds(next.h, next.m, next.s)
    lastEmitted.current = seconds
    onChange(seconds)
  }

  function update(part: 'h' | 'm' | 's', raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    commit({ ...parts, [part]: digits })
  }

  function clamp(part: 'm' | 's') {
    const raw = parts[part]
    if (!raw) return
    const n = parseInt(raw, 10)
    if (isNaN(n) || n < 0) {
      commit({ ...parts, [part]: '' })
      return
    }
    if (n > 59) commit({ ...parts, [part]: '59' })
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className="flex h-4 w-full items-end justify-center truncate text-center text-[9px] leading-none text-gray-500">
        時間
      </span>
      <div className="flex h-7 w-full min-w-0 items-center justify-center">
        <input
          type="text"
          inputMode="numeric"
          value={parts.h}
          onChange={e => update('h', e.target.value)}
          placeholder="—"
          aria-label="時間（時）"
          className={`${TIME_INPUT_CLS} w-[1.15rem] shrink-0`}
        />
        <span className="shrink-0 px-px text-[9px] leading-none text-gray-600">:</span>
        <input
          type="text"
          inputMode="numeric"
          value={parts.m}
          onChange={e => update('m', e.target.value)}
          onBlur={() => clamp('m')}
          placeholder="—"
          aria-label="時間（分）"
          className={`${TIME_INPUT_CLS} w-[1.15rem] shrink-0`}
        />
        <span className="shrink-0 px-px text-[9px] leading-none text-gray-600">:</span>
        <input
          type="text"
          inputMode="numeric"
          value={parts.s}
          onChange={e => update('s', e.target.value)}
          onBlur={() => clamp('s')}
          placeholder="—"
          aria-label="時間（秒）"
          className={`${TIME_INPUT_CLS} w-[1.15rem] shrink-0`}
        />
      </div>
      <div className="flex w-full min-w-0 items-center justify-center text-[8px] leading-none text-gray-600">
        <span className="w-[1.15rem] shrink-0 text-center">時</span>
        <span className="w-[0.45rem] shrink-0" aria-hidden="true" />
        <span className="w-[1.15rem] shrink-0 text-center">分</span>
        <span className="w-[0.45rem] shrink-0" aria-hidden="true" />
        <span className="w-[1.15rem] shrink-0 text-center">秒</span>
      </div>
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

        {/* メトリクス + 推定1RM（7列固定・折り返しなし） */}
        <div className={METRICS_GRID_CLS}>
          <MetricField label="重量" unit="kg"
            value={m.weight?.toString() ?? ''}
            onChange={v => onChange({ ...m, weight: v ? +v : undefined })} />
          <BodyweightField
            checked={!!m.bodyweight}
            onChange={v => onChange({ ...m, bodyweight: v || undefined })} />
          <MetricField label="回数" unit="回"
            value={m.reps?.toString() ?? ''}
            onChange={v => onChange({ ...m, reps: v ? +v : undefined })} />
          <MetricField label="距離" unit="m"
            value={m.distance?.toString() ?? ''}
            onChange={v => onChange({ ...m, distance: v ? +v : undefined })} />
          <TimeField
            value={m.time}
            onChange={time => onChange({ ...m, time })} />
          <MetricField label="RPE" unit="/10"
            value={m.rpe?.toString() ?? ''}
            onChange={v => onChange({ ...m, rpe: v ? +v : undefined })} />
          <MetricField label="1RM" unit="kg"
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

// ===== SupersetRoundRow =====

function SupersetRoundRow({
  row,
  letter,
  prevRow,
  onDelete,
  onChange,
}: {
  row: ExerciseRow
  letter: string
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
      <div className="px-3 py-3 border-b border-purple-500/15 last:border-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-[11px] font-bold text-purple-300 border border-purple-500/30">
            {letter}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-purple-100">{row.exerciseName}</span>
          {prevRow && (
            <button
              onClick={() => onChange({ ...prevRow.metrics })}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300 transition-colors hover:bg-purple-500/20"
            >
              <ArrowLeft size={10} />
              前ラウンド
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-gray-600 transition-colors hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className={`${METRICS_GRID_CLS} pl-8`}>
          <MetricField label="重量" unit="kg"
            value={m.weight?.toString() ?? ''}
            onChange={v => onChange({ ...m, weight: v ? +v : undefined })} />
          <BodyweightField
            checked={!!m.bodyweight}
            onChange={v => onChange({ ...m, bodyweight: v || undefined })} />
          <MetricField label="回数" unit="回"
            value={m.reps?.toString() ?? ''}
            onChange={v => onChange({ ...m, reps: v ? +v : undefined })} />
          <MetricField label="距離" unit="m"
            value={m.distance?.toString() ?? ''}
            onChange={v => onChange({ ...m, distance: v ? +v : undefined })} />
          <TimeField
            value={m.time}
            onChange={time => onChange({ ...m, time })} />
          <MetricField label="RPE" unit="/10"
            value={m.rpe?.toString() ?? ''}
            onChange={v => onChange({ ...m, rpe: v ? +v : undefined })} />
          <MetricField label="1RM" unit="kg"
            readOnly
            displayValue={estRM}
            highlight={!!estRM} />
        </div>

        <div className="mt-2.5 flex items-center gap-2 pl-8">
          <span className="shrink-0 text-[10px] text-gray-500">メモ</span>
          <input
            type="text"
            value={m.note ?? ''}
            onChange={e => onChange({ ...m, note: e.target.value })}
            placeholder="メモ（任意）"
            className="flex-1 rounded-lg border border-white/8 bg-[#252525] px-2.5 py-1 text-[11px] text-gray-300 placeholder-gray-600 outline-none focus:border-purple-500/40"
          />
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">種目を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              このラウンドの {row.exerciseName} の記録が削除されます。
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

// ===== SupersetBlockView =====

function SupersetBlockView({
  block,
  onDelete,
  onChange,
  onAddRound,
  onAddExercise,
}: {
  block: WorkBlock
  onDelete: (id: string) => void
  onChange: (id: string, m: ExerciseRow['metrics']) => void
  onAddRound: () => void
  onAddExercise: () => void
}) {
  const exerciseOrder = getExerciseOrder(block.rows)
  const letterMap = Object.fromEntries(exerciseOrder.map((id, i) => [id, getExerciseLetter(i)]))
  const rounds = groupRowsByRound(block.rows)
  const groupMap = groupRowsByExercise(block.rows)

  return (
    <div className={`rounded-xl border overflow-hidden ${BLOCK_CONTAINER_CLS['スーパーセット'] ?? 'border-white/8'}`}>
      <div className="flex items-start gap-2 border-b border-purple-500/20 bg-purple-500/10 px-3 py-2.5">
        <Repeat2 size={14} className="mt-0.5 shrink-0 text-purple-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-purple-200">交互セット記録</p>
          <p className="text-[10px] leading-snug text-purple-300/70">
            ラウンドごとに全種目を順番に実施 · {exerciseOrder.length}種目 × {rounds.length || 0}ラウンド
          </p>
        </div>
      </div>

      {block.rows.length === 0 ? (
        <button
          type="button"
          onClick={onAddExercise}
          className="flex w-full items-center justify-center gap-2 border-b border-purple-500/15 py-5 text-sm text-purple-300 transition-colors hover:bg-purple-500/10"
        >
          <Plus size={16} /> 種目を追加して記録開始
        </button>
      ) : (
        <>
          {exerciseOrder.length === 1 && (
            <div className="border-b border-purple-500/15 bg-purple-500/5 px-3 py-2">
              <p className="text-[11px] text-purple-300/80">
                もう1種目追加すると、ラウンド内で交互に記録できます
              </p>
            </div>
          )}

          {rounds.map(({ round, rows }) => {
            const doneCount = rows.filter(isRowCompleted).length
            return (
              <div key={round} className="border-b border-purple-500/15 last:border-b-0">
                <div className="flex items-center gap-2 bg-purple-500/[0.07] px-3 py-2">
                  <span className="text-xs font-bold text-purple-300">ラウンド {round}</span>
                  <span className="text-[10px] text-purple-400/70">{doneCount}/{rows.length} 完了</span>
                </div>
                <div>
                  {rows.map(row => {
                    const prevRoundRow = groupMap[row.exerciseId]?.find(r => r.round === round - 1)
                    return (
                      <SupersetRoundRow
                        key={row.id}
                        row={row}
                        letter={letterMap[row.exerciseId]}
                        prevRow={prevRoundRow}
                        onDelete={() => onDelete(row.id)}
                        onChange={m => onChange(row.id, m)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="flex gap-2 border-t border-purple-500/20 bg-[#1a1a1a]/60 p-2.5">
            <button
              type="button"
              onClick={onAddRound}
              disabled={exerciseOrder.length === 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 py-2.5 text-xs font-semibold text-purple-200 transition-colors hover:bg-purple-500/25 disabled:opacity-40 min-h-10"
            >
              <Repeat2 size={13} /> ラウンドを追加
            </button>
            <button
              type="button"
              onClick={onAddExercise}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-purple-500/30 py-2.5 text-xs text-purple-300/80 transition-colors hover:border-purple-500/50 hover:text-purple-200 min-h-10"
            >
              <Plus size={13} /> 種目を追加
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ===== LapBlockView =====

function LapBlockView({
  rows,
  onDelete,
}: {
  rows: ExerciseRow[]
  onDelete: (id: string) => void
}) {
  const sorted = [...rows].sort((a, b) => a.order - b.order)
  const totalMs = sorted[sorted.length - 1]?.metrics.lapTotalMs

  return (
    <div className="rounded-xl border border-orange-500/25 bg-orange-500/[0.04] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-orange-500/20 bg-orange-500/10 px-3 py-2.5">
        <Flag size={14} className="shrink-0 text-orange-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-orange-200">ラップ計測</p>
          <p className="text-[10px] leading-snug text-orange-300/70">
            {sorted.length}ラップ
            {totalMs != null ? ` · 合計 ${formatMs(totalMs)}` : ''}
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {sorted.map(row => {
          const kind = getLapRowKind(row)
          const label = getLapRowLabel(row)
          const splitMs = row.metrics.lapSplitMs
          const total = row.metrics.lapTotalMs

          return (
            <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-6 shrink-0 text-xs text-gray-600">#{row.order}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-500">
                  <span className={kind === '移動' ? 'text-gray-400' : 'text-orange-300/80'}>
                    {kind}
                  </span>
                  {total != null && <> · 累計 {formatMs(total)}</>}
                  {row.metrics.distance != null && <> · {row.metrics.distance}m</>}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-orange-400">
                {splitMs != null ? formatMs(splitMs) : row.metrics.time != null ? `${row.metrics.time}s` : '—'}
              </span>
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="shrink-0 p-1 text-gray-600 transition-colors hover:text-red-400"
                aria-label={`ラップ #${row.order} を削除`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== ExerciseHistorySheet =====

function formatHistoryDateJP(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

function ExerciseHistorySheet({
  open,
  onClose,
  exerciseName,
  history,
}: {
  open: boolean
  onClose: () => void
  exerciseName: string
  history: ExerciseHistorySnapshot | null
}) {
  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#1a1a1a] border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto px-0"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 shrink-0" />

        {!history ? (
          <div className="px-4 py-10 text-center pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
            <History size={28} className="mx-auto mb-3 text-gray-700" />
            <p className="text-sm text-gray-500">この種目の履歴はまだありません</p>
          </div>
        ) : (
          <>
            <SheetHeader className="px-4 pb-3 border-b border-white/10">
              <p className="text-xs text-gray-500">{formatHistoryDateJP(history.date)}</p>
              <SheetTitle className="text-white text-left">{history.sessionName}</SheetTitle>
              <p className="text-xs text-gray-500 text-left">{exerciseName} · {history.rows.length}セット</p>
            </SheetHeader>

            <div className="p-4 space-y-1.5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
              <div className="space-y-1.5 pl-2 border-l border-white/8">
                {history.rows.map(row => {
                  const completed = isRowCompleted(row)
                  const estRM = row.metrics.weight && row.metrics.reps
                    ? calcEstimatedRM(row.metrics.weight, row.metrics.reps)
                    : null
                  const note = row.metrics.note?.trim()

                  return (
                    <div key={row.id}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          completed ? 'bg-[#1f2a1f]' : 'bg-[#1e1e1e] opacity-60'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-xs">{exerciseName}</span>
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
                          {row.metrics.rpe != null && <span>RPE {row.metrics.rpe}</span>}
                          {estRM && (
                            <span className="text-orange-400 flex items-center gap-0.5">
                              <TrendingUp size={11} />{estRM}kg
                            </span>
                          )}
                        </div>
                      </div>
                      {note && (
                        <p className="mt-1 pl-3 pr-1 text-[11px] leading-snug text-gray-500">
                          メモ: {note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ===== ExerciseGroup =====

function ExerciseGroup({
  exerciseId, exerciseName, rows, sessionId, sessions,
  onDelete, onChange, onCopy,
}: {
  exerciseId: string
  exerciseName: string
  rows: ExerciseRow[]
  sessionId: string
  sessions: Session[]
  onDelete: (id: string) => void
  onChange: (id: string, m: ExerciseRow['metrics']) => void
  onCopy: () => void
}) {
  const [open, setOpen] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const doneCount = rows.filter(isRowCompleted).length
  const history = findPreviousExerciseHistory(sessions, exerciseId, sessionId)

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center gap-1.5 px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="min-w-0 truncate text-sm font-semibold">{exerciseName}</span>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-400 transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
            >
              <History size={11} />
              前回
            </button>
          </div>
          <span className="shrink-0 text-xs text-gray-500">{rows.length}セット</span>
          <button
            onClick={onCopy}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-gray-400 transition-colors hover:border-orange-500/30 hover:bg-orange-500/15 hover:text-orange-400"
          >
            <Plus size={12} strokeWidth={2.5} />
            セット追加
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

      <ExerciseHistorySheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        exerciseName={exerciseName}
        history={history}
      />
    </>
  )
}

// ===== ExercisePicker =====

function ExercisePicker({ open, onSelect, onClose }: {
  open: boolean; onSelect: (ex: ExerciseMaster) => void; onClose: () => void
}) {
  const { exercises, saveExercise, getSubCategories, addCustomSubCategory, customSubCategories } = useWorkoutStore()
  const [selectedMain, setSelectedMain] = useState<MainCategory | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMain, setNewMain] = useState<MainCategory>('筋トレ')
  const [newSub, setNewSub] = useState(DEFAULT_SUB_CATEGORIES['筋トレ'][0])
  const [addingSub, setAddingSub] = useState(false)
  const [newSubName, setNewSubName] = useState('')

  const subCategories = selectedMain ? getSubCategories(selectedMain) : []
  const showCreateSubGroups = hasSubCategoryGroups(newMain, customSubCategories)
  const showFilterSubGroups = selectedMain
    ? hasSubCategoryGroups(selectedMain, customSubCategories) && subCategories.length > 0
    : false

  const filtered = exercises.filter(ex => {
    if (query) return ex.name.toLowerCase().includes(query.toLowerCase())
    if (selectedSub) return ex.subCategory === selectedSub
    if (selectedMain) return ex.mainCategory === selectedMain
    return true
  })

  function handleCreate() {
    if (!newName.trim()) return
    const created = createExerciseMaster(newName.trim(), newMain, newSub)
    saveExercise(created)
    onSelect(created)
    setNewName(''); setShowCreate(false)
  }

  function handleMainSelect(main: MainCategory) {
    setNewMain(main)
    if (hasSubCategoryGroups(main, customSubCategories)) {
      setNewSub(getSubCategories(main)[0] ?? DEFAULT_SUB_CATEGORIES[main][0] ?? '')
    } else {
      setNewSub('')
    }
    setAddingSub(false)
    setNewSubName('')
  }

  function handleAddSubCategory(main: MainCategory) {
    const trimmed = newSubName.trim()
    if (!trimmed) return
    addCustomSubCategory(main, trimmed)
    setNewSub(trimmed)
    setAddingSub(false)
    setNewSubName('')
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
              {MAIN_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => handleMainSelect(cat)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${newMain === cat ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {showCreateSubGroups ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {getSubCategories(newMain).map(sub => (
                  <button key={sub} onClick={() => setNewSub(sub)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${newSub === sub ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                    {sub}
                  </button>
                ))}
                {addingSub ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSubCategory(newMain) }}
                      placeholder="名前" autoFocus
                      className="w-24 bg-[#2a2a2a] border border-orange-500/40 rounded-full px-2.5 py-1 text-xs outline-none" />
                    <button onClick={() => handleAddSubCategory(newMain)} disabled={!newSubName.trim()}
                      className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/40 disabled:opacity-40">
                      追加
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setAddingSub(true)}
                    className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-dashed border-white/20 text-gray-400">
                    <Plus size={12} className="inline" /> 追加
                  </button>
                )}
              </div>
            ) : addingSub ? (
              <div className="flex items-center gap-1 mb-2">
                <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubCategory(newMain) }}
                  placeholder="小カテゴリ名" autoFocus
                  className="flex-1 bg-[#2a2a2a] border border-orange-500/40 rounded-lg px-3 py-2 text-sm outline-none" />
                <button onClick={() => handleAddSubCategory(newMain)} disabled={!newSubName.trim()}
                  className="px-3 py-2 rounded-lg text-xs bg-orange-500/20 text-orange-300 border border-orange-500/40 disabled:opacity-40">
                  追加
                </button>
              </div>
            ) : (
              <button onClick={() => setAddingSub(true)}
                className="mb-2 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 border border-dashed border-white/20 text-gray-400">
                <Plus size={12} className="inline" /> 小カテゴリを追加（任意）
              </button>
            )}
            <button onClick={handleCreate} disabled={!newName.trim()}
              className="w-full bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold py-2 rounded-lg">
              作成して追加
            </button>
          </div>
        )}

        {!query && (
          <div className="px-4 shrink-0">
            <div className="flex gap-1.5 mb-2">
              {MAIN_CATEGORIES.map(cat => (
                <button key={cat}
                  onClick={() => { setSelectedMain(selectedMain === cat ? null : cat); setSelectedSub(null) }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMain === cat ? 'bg-orange-500 text-white' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {showFilterSubGroups && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subCategories.map(sub => (
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
                    <p className="text-xs text-gray-500">{formatExerciseCategoryLabel(ex)}</p>
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

// ===== SessionEditor 本体 =====

export default function SessionEditor({
  sessionId = 'new',
  embedded = false,
  onComplete,
  onBack,
  onStartTimer,
}: {
  sessionId?: string
  embedded?: boolean
  onComplete?: () => void
  onBack?: () => void
  onStartTimer?: () => void
}) {
  const router = useRouter()
  const {
    getSession,
    ensureSession,
    updateSession,
    syncMenuToSession,
    startTimerRun,
    activeRun,
    sessions,
  } = useWorkoutStore()

  const storeSession = getSession(sessionId)
  const [session, setSessionLocal] = useState<Session>(
    storeSession ?? newSession(),
  )
  const [menuSteps, setMenuSteps] = useState<LapStep[]>(
    storeSession?.plannedMenu ? cloneSteps(storeSession.plannedMenu) : [],
  )

  useEffect(() => {
    let s = getSession(sessionId)
    if (!s) {
      s = ensureSession(sessionId)
    }
    setSessionLocal(s)
    if (s.plannedMenu?.length) {
      setMenuSteps(cloneSteps(s.plannedMenu))
    } else {
      setMenuSteps([])
    }
  }, [sessionId, sessions, getSession, ensureSession])

  const setSession = (updater: Session | ((prev: Session) => Session)) => {
    setSessionLocal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      updateSession(next)
      return next
    })
  }

  const linkedRun = activeRun?.sessionId === sessionId ? activeRun : null
  const isMeasuring = !!linkedRun && (linkedRun.status === 'running' || linkedRun.status === 'paused')

  function handleMenuChange(steps: LapStep[]) {
    setMenuSteps(steps)
    syncMenuToSession(sessionId, steps)
    setSession(prev => ({ ...prev, plannedMenu: cloneSteps(steps) }))
  }

  function handleStartTimerFromMenu() {
    if (menuSteps.length === 0) return
    startTimerRun(sessionId, menuSteps)
    onStartTimer?.()
  }

  const [pickerForBlock, setPickerForBlock] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [blockPickerBlockId, setBlockPickerBlockId] = useState<string | null>(null)
  const autoOpenedBlockPicker = useRef(false)

  useEffect(() => {
    if (autoOpenedBlockPicker.current || session.blocks.length > 0) return
    autoOpenedBlockPicker.current = true
    setShowBlockPicker(true)
  }, [session.blocks.length])

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
        rows: b.rows.map(r =>
          r.id === rowId
            ? { ...r, metrics, status: deriveRowStatus(metrics) }
            : r,
        ),
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
          status: 'draft', metrics: {},
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
        if (sameEx.length > 0) {
          const newRow: ExerciseRow = {
            id: `row-new-${Date.now()}`,
            exerciseId: ex.id, exerciseName: ex.name,
            round: sameEx.length + 1, order: b.rows.length + 1,
            status: 'draft', metrics: {},
          }
          return { ...b, rows: [...b.rows, newRow] }
        }

        if (b.type === 'スーパーセット') {
          const maxRound = getMaxRound(b.rows)
          const roundsToAdd = maxRound > 0 ? maxRound : 1
          const baseOrder = b.rows.length
          const newRows: ExerciseRow[] = Array.from({ length: roundsToAdd }, (_, i) => ({
            id: `row-new-${Date.now()}-${i}`,
            exerciseId: ex.id,
            exerciseName: ex.name,
            round: i + 1,
            order: baseOrder + i + 1,
            status: 'draft',
            metrics: {},
          }))
          return { ...b, rows: [...b.rows, ...newRows] }
        }

        const newRow: ExerciseRow = {
          id: `row-new-${Date.now()}`,
          exerciseId: ex.id, exerciseName: ex.name,
          round: 1, order: b.rows.length + 1,
          status: 'draft', metrics: {},
        }
        return { ...b, rows: [...b.rows, newRow] }
      }),
    }))
    setPickerForBlock(null)
  }

  function addSupersetRound(blockId: string) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id !== blockId || b.type !== 'スーパーセット') return b
        const exerciseOrder = getExerciseOrder(b.rows)
        if (exerciseOrder.length === 0) return b

        const groupMap = groupRowsByExercise(b.rows)
        const maxRound = getMaxRound(b.rows)
        const newRound = maxRound + 1
        const baseOrder = b.rows.length

        const newRows: ExerciseRow[] = exerciseOrder.map((exId, i) => {
          const exRows = groupMap[exId]
          const last = exRows[exRows.length - 1]
          return {
            id: `row-round-${Date.now()}-${i}`,
            exerciseId: exId,
            exerciseName: last.exerciseName,
            round: newRound,
            order: baseOrder + i + 1,
            status: deriveRowStatus(last.metrics),
            metrics: { ...last.metrics },
          }
        })

        return { ...b, rows: [...b.rows, ...newRows] }
      }),
    }))
  }

  function addBlock(type: BlockType) {
    setSession(prev => ({
      ...prev,
      blocks: [...prev.blocks, {
        id: `block-new-${Date.now()}`, type,
        order: prev.blocks.length + 1, rows: [],
      }],
    }))
    closeBlockPicker()
  }

  function changeBlockType(blockId: string, type: BlockType) {
    setSession(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId && b.rows.length === 0 ? { ...b, type } : b,
      ),
    }))
    closeBlockPicker()
  }

  function openBlockPickerForAdd() {
    setBlockPickerBlockId(null)
    setShowBlockPicker(true)
  }

  function openBlockPickerForChange(blockId: string) {
    setBlockPickerBlockId(blockId)
    setShowBlockPicker(true)
  }

  function closeBlockPicker() {
    setShowBlockPicker(false)
    setBlockPickerBlockId(null)
  }

  function handleBlockTypeSelect(type: BlockType) {
    if (blockPickerBlockId) changeBlockType(blockPickerBlockId, type)
    else addBlock(type)
  }

  // ===== 集計 =====

  const allRows = session.blocks.flatMap(b => b.rows)
  const completedCount = allRows.filter(isRowCompleted).length
  const totalCount = allRows.length
  const progressPct = totalCount ? (completedCount / totalCount) * 100 : 0

  function handleBack() {
    if (onBack) onBack()
    else router.back()
  }

  function handleComplete() {
    setSession(prev => ({ ...prev, status: 'completed' }))
    if (onComplete) onComplete()
    else router.push('/?pane=history')
  }

  return (
    <div className={embedded ? undefined : 'app-page-session'}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-sm border-b border-white/10 shrink-0">
        <div className="flex items-center h-12 px-2">
          {!embedded && (
            <button type="button" onClick={handleBack} className="p-2 text-gray-400">
              <ArrowLeft size={22} />
            </button>
          )}
          <div className={`flex-1 ${embedded ? 'px-3' : 'px-2'}`}>
            <input type="text" value={session.name}
              onChange={e => setSession(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none text-left" />
          </div>
          {!embedded && <div className="w-10" />}
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

        {isMeasuring && linkedRun && (
          <SessionStatusBar
            run={linkedRun}
            variant="training"
            onOpenTimer={onStartTimer}
          />
        )}
      </div>

      <LapMenuBar
        steps={menuSteps}
        onChange={handleMenuChange}
        onStartTimer={handleStartTimerFromMenu}
        isMeasuring={isMeasuring}
        linkedTimerRunId={session.linkedTimerRunId}
        defaultOpen={menuSteps.length === 0}
      />

      <div className="px-4 pt-4 space-y-6 pb-4">
        {/* 日付・ステータス */}
        <div className="space-y-3">
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
          <div>
            <label className="text-xs text-gray-500 mb-1 block">セッションメモ</label>
            <textarea
              value={session.note ?? ''}
              onChange={e => setSession(prev => ({ ...prev, note: e.target.value }))}
              placeholder="今日のトレーニングのメモ..."
              rows={2}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-orange-500/30 resize-none"
            />
          </div>
        </div>

        {/* ブロック一覧（記録入力） */}
        {session.blocks.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Plus size={28} className="text-gray-700 mb-3" />
            <p className="text-sm text-gray-500 mb-1">ブロックを追加して記録を始めましょう</p>
            <p className="text-xs text-gray-600 mb-3">HYROX計測は上のラップメニューから</p>
            <button
              type="button"
              onClick={openBlockPickerForAdd}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
            >
              <Plus size={16} /> ブロックを追加
            </button>
          </div>
        ) : (
          session.blocks.map((block, idx) => {
            const isLap = isLapBlock(block)
            const order = getExerciseOrder(block.rows)
            const groupMap = groupRowsByExercise(block.rows)
            const isSuperset = block.type === 'スーパーセット'

            return (
              <div key={block.id} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <span className="text-xs font-bold text-gray-600">Block {idx + 1}</span>
                  {isLap ? (
                    <Badge variant="outline" className="text-[10px] font-semibold border bg-orange-500/20 text-orange-300 border-orange-500/30">
                      ラップ計測
                    </Badge>
                  ) : block.rows.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openBlockPickerForChange(block.id)}
                      className="inline-flex items-center gap-0.5 rounded-full transition-opacity hover:opacity-80"
                      aria-label="ブロックの種類を変更"
                    >
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${BLOCK_TYPE_CLS[block.type]}`}>
                        {block.type}
                      </Badge>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>
                  ) : (
                    <Badge variant="outline" className={`text-[10px] font-semibold border ${BLOCK_TYPE_CLS[block.type]}`}>
                      {block.type}
                    </Badge>
                  )}
                  {isSuperset && order.length > 0 && (
                    <span className="text-[10px] text-purple-400/80">
                      {order.length}種目 · {groupRowsByRound(block.rows).length}ラウンド
                    </span>
                  )}
                </div>

                {isLap ? (
                  <LapBlockView
                    rows={block.rows}
                    onDelete={deleteRow}
                  />
                ) : isSuperset ? (
                  <SupersetBlockView
                    block={block}
                    onDelete={deleteRow}
                    onChange={changeMetrics}
                    onAddRound={() => addSupersetRound(block.id)}
                    onAddExercise={() => setPickerForBlock(block.id)}
                  />
                ) : order.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setPickerForBlock(block.id)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-orange-500/30 bg-orange-500/5 rounded-xl py-4 text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    <Plus size={16} /> 種目を追加して記録開始
                  </button>
                ) : (
                  <>
                    {order.map(exId => (
                      <ExerciseGroup key={exId}
                        exerciseId={exId}
                        exerciseName={groupMap[exId][0].exerciseName}
                        rows={groupMap[exId]}
                        sessionId={sessionId}
                        sessions={sessions}
                        onDelete={deleteRow}
                        onChange={changeMetrics}
                        onCopy={() => copySet(block.id, exId)} />
                    ))}
                    <button type="button" onClick={() => setPickerForBlock(block.id)}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-white/15 rounded-xl py-2.5 text-xs text-gray-600 hover:border-orange-500/40 hover:text-orange-400 transition-colors min-h-11">
                      <Plus size={13} /> 種目を追加
                    </button>
                  </>
                )}
              </div>
            )
          })
        )}

        {session.blocks.length > 0 && (
          <button type="button" onClick={openBlockPickerForAdd}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl py-3 text-sm text-gray-500 hover:border-orange-500/50 hover:text-orange-400 transition-colors min-h-11">
            <Plus size={16} /> ブロックを追加
          </button>
        )}

      </div>

      {/* 完了ボタン */}
      <div className={
        embedded
          ? 'sticky bottom-0 px-4 py-3 bg-[#111111]/95 border-t border-white/10 backdrop-blur-sm'
          : 'app-fixed-bottom px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-3 bg-gradient-to-t from-[#111111] to-transparent'
      }>
        <button type="button" onClick={handleComplete}
          className="w-full bg-[#1a1a1a] border border-white/15 font-bold py-3.5 rounded-2xl hover:bg-[#222] transition-colors">
          セッションを完了
        </button>
      </div>

      {/* 種目ピッカー */}
      <ExercisePicker
        open={pickerForBlock !== null}
        onSelect={ex => pickerForBlock && addExercise(pickerForBlock, ex)}
        onClose={() => setPickerForBlock(null)} />

      {/* ブロック種類ピッカー */}
      <Sheet open={showBlockPicker} onOpenChange={o => !o && closeBlockPicker()}>
        <SheetContent side="bottom" className="bg-[#1e1e1e] border-white/10 rounded-t-2xl p-6 pb-10">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-sm font-bold mb-4">
            {blockPickerBlockId ? 'ブロックの種類を変更' : 'ブロックの種類を選択'}
          </h3>
          <div className="space-y-2">
            {BLOCK_TYPES.map(type => (
              <button key={type} onClick={() => handleBlockTypeSelect(type)}
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
