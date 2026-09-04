'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Plus, Trash2, Pencil, Check, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createExerciseMaster,
  isBuiltInExercise,
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
  type ExerciseMaster,
  type MainCategory,
  type SubCategory,
} from '@/lib/data'
import { useWorkoutStore } from '@/lib/workout-store'

export default function ExerciseManagementView({
  onBack,
}: {
  onBack: () => void
}) {
  const { exercises, saveExercise, deleteExercise } = useWorkoutStore()

  const [view, setView] = useState<'list' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [mainCategory, setMainCategory] = useState<MainCategory>('筋トレ')
  const [subCategory, setSubCategory] = useState<SubCategory>('胸')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)

  const editingExercise = editingId
    ? exercises.find(e => e.id === editingId)
    : undefined
  const isNew = view === 'edit' && editingId === null
  const isBuiltIn = editingId ? isBuiltInExercise(editingId) : false

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(q)
      || ex.mainCategory.toLowerCase().includes(q)
      || ex.subCategory.toLowerCase().includes(q),
    )
  }, [exercises, query])

  const grouped = useMemo(() => {
    const sections: {
      main: MainCategory
      sub: SubCategory
      items: ExerciseMaster[]
    }[] = []

    for (const main of MAIN_CATEGORIES) {
      for (const sub of SUB_CATEGORIES[main]) {
        const items = filtered
          .filter(ex => ex.mainCategory === main && ex.subCategory === sub)
          .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
        if (items.length > 0) {
          sections.push({ main, sub, items })
        }
      }
    }

    return sections
  }, [filtered])

  function openEdit(id: string) {
    const ex = exercises.find(e => e.id === id)
    if (!ex) return
    setEditingId(id)
    setName(ex.name)
    setMainCategory(ex.mainCategory)
    setSubCategory(ex.subCategory)
    setView('edit')
  }

  function openNew() {
    setEditingId(null)
    setName('新規種目')
    setMainCategory('筋トレ')
    setSubCategory('胸')
    setView('edit')
  }

  function backToList() {
    setView('list')
    setEditingId(null)
    setSaved(false)
  }

  function handleMainChange(main: MainCategory) {
    setMainCategory(main)
    setSubCategory(SUB_CATEGORIES[main][0])
  }

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (isNew) {
      saveExercise(createExerciseMaster(trimmed, mainCategory, subCategory))
    } else if (editingExercise) {
      saveExercise({
        ...editingExercise,
        name: trimmed,
        mainCategory,
        subCategory,
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    backToList()
  }

  function handleDelete() {
    if (!editingId || isBuiltIn) return
    if (!window.confirm(`「${name}」を削除しますか？\n過去の記録に残っている種目名は変更されません。`)) return
    deleteExercise(editingId)
    backToList()
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
            {isNew ? '新規種目' : '種目編集'}
          </h3>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check size={14} /> 保存しました
            </span>
          )}
        </div>

        <label className="block">
          <span className="text-xs text-gray-500">種目名</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1.5 w-full bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/40"
          />
        </label>

        <div>
          <span className="text-xs text-gray-500">大カテゴリ</span>
          <div className="flex gap-1.5 mt-1.5">
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleMainChange(cat)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mainCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-gray-500">小カテゴリ</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {SUB_CATEGORIES[mainCategory].map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubCategory(sub)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  subCategory === sub
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            className="flex-1 bg-orange-500 hover:bg-orange-400"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            保存
          </Button>
          {!isNew && !isBuiltIn && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              title="削除"
            >
              <Trash2 size={14} />
            </Button>
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
        <h3 className="text-sm font-semibold flex-1">種目管理</h3>
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
        ベンチプレスなど種目単体の名前変更・追加・削除ができます。HYROX等のラップ計測用テンプレートは「セットメニュー管理」で編集してください。
      </p>

      <div className="flex items-center gap-2 bg-[#252525] border border-white/10 rounded-xl px-3 py-2">
        <Search size={15} className="text-gray-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="種目名・カテゴリで検索..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {MAIN_CATEGORIES.map(main => {
          const mainSections = grouped.filter(section => section.main === main)
          if (mainSections.length === 0) return null

          return (
            <section key={main} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-orange-400/90">{main}</h4>
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[10px] text-gray-600 tabular-nums">
                  {mainSections.reduce((sum, section) => sum + section.items.length, 0)}件
                </span>
              </div>

              <div className="space-y-3 pl-1">
                {mainSections.map(({ sub, items }) => (
                  <div key={`${main}-${sub}`} className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-medium text-gray-400">{sub}</span>
                      <span className="text-[10px] text-gray-600 tabular-nums">{items.length}</span>
                    </div>

                    <div className="space-y-1">
                      {items.map(ex => (
                        <div
                          key={ex.id}
                          className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(ex.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-sm truncate">{ex.name}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(ex.id)}
                            className="p-1.5 text-gray-500 hover:text-orange-400"
                            title="編集"
                          >
                            <Pencil size={14} />
                          </button>
                          {!isBuiltInExercise(ex.id) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`「${ex.name}」を削除しますか？`)) {
                                  deleteExercise(ex.id)
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-400"
                              title="削除"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            {query ? '該当する種目がありません' : '種目がありません'}
          </p>
        </div>
      )}
    </div>
  )
}
