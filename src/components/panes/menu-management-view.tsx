'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Copy, Trash2, Pencil, Lock, Check } from 'lucide-react'
import MenuEditor from '@/components/menu-editor'
import { Button } from '@/components/ui/button'
import { useWorkoutStore, HYROX_OFFICIAL_MENU_ID } from '@/lib/workout-store'
import { cloneSteps, createMenuTemplate, type LapStep } from '@/lib/workout-types'
import {
  applyHyroxDivisionWeights,
  HYROX_DIVISION_LABELS,
  type HyroxDivision,
} from '@/lib/hyrox-official-menu'

function sourceLabel(source: string) {
  switch (source) {
    case 'hyrox_official': return 'HYROX正規'
    case 'session_derived': return 'セッション由来'
    default: return 'カスタム'
  }
}

export default function MenuManagementView({
  onBack,
}: {
  onBack: () => void
}) {
  const {
    menuTemplates,
    saveMenuTemplate,
    deleteMenuTemplate,
    duplicateMenuTemplate,
  } = useWorkoutStore()

  const [view, setView] = useState<'list' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [steps, setSteps] = useState<LapStep[]>([])
  const [saved, setSaved] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<HyroxDivision | null>(null)

  const editingTemplate = editingId
    ? menuTemplates.find(m => m.id === editingId)
    : undefined
  const isOfficial = editingId === HYROX_OFFICIAL_MENU_ID
  const isNew = view === 'edit' && editingId === null

  useEffect(() => {
    if (view !== 'edit' || !editingId) return
    const t = menuTemplates.find(m => m.id === editingId)
    if (!t) return
    setName(t.name)
    setSteps(cloneSteps(t.steps))
  }, [view, editingId, menuTemplates])

  function openEdit(id: string) {
    const t = menuTemplates.find(m => m.id === id)
    if (!t) return
    setEditingId(id)
    setName(t.name)
    setSteps(cloneSteps(t.steps))
    setView('edit')
  }

  function openNew() {
    setEditingId(null)
    setName('新規メニュー')
    setSteps([])
    setView('edit')
  }

  function backToList() {
    setView('list')
    setEditingId(null)
    setSaved(false)
  }

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (isOfficial && editingTemplate) {
      saveMenuTemplate({
        ...editingTemplate,
        steps: cloneSteps(steps),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    if (isNew) {
      saveMenuTemplate(createMenuTemplate(trimmed, steps, 'custom'))
    } else if (editingTemplate) {
      saveMenuTemplate({
        ...editingTemplate,
        name: trimmed,
        steps: cloneSteps(steps),
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    backToList()
  }

  function applyDivision(division: HyroxDivision) {
    setSelectedDivision(division)
    setSteps(prev => applyHyroxDivisionWeights(prev, division))
  }

  function handleDelete() {
    if (!editingId || isOfficial) return
    if (!window.confirm(`「${name}」を削除しますか？`)) return
    deleteMenuTemplate(editingId)
    backToList()
  }

  function handleDuplicate(id: string) {
    const copy = duplicateMenuTemplate(id)
    if (copy) openEdit(copy.id)
  }

  if (view === 'edit') {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={backToList}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-200"
            aria-label="一覧に戻る"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-sm font-semibold flex-1">
            {isNew ? '新規メニュー' : isOfficial ? 'メニュー詳細' : 'メニュー編集'}
          </h3>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check size={14} /> 保存しました
            </span>
          )}
        </div>

        {isOfficial && (
          <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2.5">
            <Lock size={14} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-200/90">
              種目・距離・回数は変更できません。重量のみ編集できます。カテゴリを選ぶと公式重量が自動入力されます。
            </p>
          </div>
        )}

        {isOfficial && (
          <div>
            <p className="text-xs text-gray-500 mb-2">カテゴリ（公式重量を一括入力）</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(HYROX_DIVISION_LABELS) as [HyroxDivision, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyDivision(key)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    selectedDivision === key
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                      : 'bg-[#252525] border-white/10 text-gray-300 hover:border-orange-500/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-xs text-gray-500">メニュー名</span>
          <input
            type="text"
            value={name}
            disabled={isOfficial}
            onChange={e => setName(e.target.value)}
            className="mt-1.5 w-full bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/40 disabled:opacity-60"
          />
        </label>

        <div>
          <p className="text-xs text-gray-500 mb-2">ステップ構成</p>
          <MenuEditor
            steps={steps}
            onChange={setSteps}
            weightOnlyEdit={isOfficial}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {isOfficial ? (
            <>
              <Button
                type="button"
                className="flex-1 bg-orange-500 hover:bg-orange-400"
                onClick={handleSave}
              >
                重量を保存
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/10"
                onClick={() => handleDuplicate(HYROX_OFFICIAL_MENU_ID)}
              >
                <Copy size={14} /> 複製
              </Button>
              <Button type="button" variant="outline" className="border-white/10" onClick={backToList}>
                閉じる
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                className="flex-1 bg-orange-500 hover:bg-orange-400"
                onClick={handleSave}
                disabled={!name.trim()}
              >
                保存
              </Button>
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  title="削除"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-200"
          aria-label="設定に戻る"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-sm font-semibold flex-1">セットメニュー管理</h3>
        <Button
          type="button"
          size="sm"
          className="bg-orange-500 hover:bg-orange-400"
          onClick={openNew}
        >
          <Plus size={14} /> 新規
        </Button>
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        HYROX等の計測ステップをテンプレート化します。セッションで使うときは記録ペインの「ラップメニュー」から選びます。ベンチプレス等の種目単体は「種目管理」で編集してください。
      </p>

      <div className="space-y-2">
        {menuTemplates.map(t => {
          const official = t.id === HYROX_OFFICIAL_MENU_ID
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => openEdit(t.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm truncate">{t.name}</p>
                  {official && <Lock size={12} className="text-orange-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {t.steps.length} ステップ · {sourceLabel(t.source)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => openEdit(t.id)}
                className="p-1.5 text-gray-500 hover:text-orange-400"
                title="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicate(t.id)}
                className="p-1.5 text-gray-500 hover:text-orange-400"
                title="複製"
              >
                <Copy size={14} />
              </button>
              {!official && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`「${t.name}」を削除しますか？`)) {
                      deleteMenuTemplate(t.id)
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-400"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {menuTemplates.length === 0 && (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-gray-500">保存済みメニューがありません</p>
          <Button type="button" className="bg-orange-500 hover:bg-orange-400" onClick={openNew}>
            <Plus size={14} /> 最初のメニューを作成
          </Button>
        </div>
      )}
    </div>
  )
}
