'use client'

import { useState } from 'react'
import { Copy, History, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkoutStore, HYROX_OFFICIAL_MENU_ID } from '@/lib/workout-store'
import { cloneSteps, createMenuTemplate, type LapStep } from '@/lib/workout-types'
import MenuEditor from '@/components/menu-editor'

export default function MenuPicker({
  steps,
  onChange,
  onSaveTemplate,
  onMenuSelect,
}: {
  steps: LapStep[]
  onChange: (steps: LapStep[]) => void
  onSaveTemplate?: (name: string) => void
  onMenuSelect?: (menuId: string) => void
}) {
  const {
    menuTemplates,
    getLastUsedMenu,
    saveMenuTemplate,
    duplicateMenuTemplate,
    setLastUsedMenu,
  } = useWorkoutStore()
  const [templateName, setTemplateName] = useState('')
  const lastMenu = getLastUsedMenu()

  function loadTemplate(id: string) {
    const t = menuTemplates.find(m => m.id === id)
    if (!t) return
    onChange(cloneSteps(t.steps))
    setLastUsedMenu(t.id)
    onMenuSelect?.(t.id)
  }

  function loadHyroxOfficial() {
    loadTemplate(HYROX_OFFICIAL_MENU_ID)
  }

  function handleSave() {
    if (!templateName.trim() || steps.length === 0) return
    const template = createMenuTemplate(templateName.trim(), steps, 'custom')
    saveMenuTemplate(template)
    setLastUsedMenu(template.id)
    onMenuSelect?.(template.id)
    setTemplateName('')
    onSaveTemplate?.(template.name)
  }

  return (
    <div className="space-y-3">
      {lastMenu && (
        <button
          type="button"
          onClick={() => loadTemplate(lastMenu.id)}
          className="w-full flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 text-left hover:bg-orange-500/15 transition-colors"
        >
          <History size={18} className="text-orange-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-orange-300 font-medium">前回のメニュー</p>
            <p className="text-sm font-semibold truncate">{lastMenu.name}</p>
            {lastMenu.lastUsedAt && (
              <p className="text-[10px] text-gray-500">
                {new Date(lastMenu.lastUsedAt).toLocaleDateString('ja-JP')}
              </p>
            )}
          </div>
        </button>
      )}

      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1 bg-orange-500 hover:bg-orange-400 text-xs" onClick={loadHyroxOfficial}>
          <Zap size={14} /> HYROX正規
        </Button>
      </div>

      {menuTemplates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">保存済みメニュー</p>
          {menuTemplates.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadTemplate(t.id)}
                className="flex-1 text-left bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2 hover:bg-[#222] transition-colors"
              >
                <p className="text-sm truncate">{t.name}</p>
                <p className="text-[10px] text-gray-500">{t.steps.length} ステップ</p>
              </button>
              {t.id !== HYROX_OFFICIAL_MENU_ID && (
                <button
                  type="button"
                  onClick={() => duplicateMenuTemplate(t.id)}
                  className="p-2 text-gray-500 hover:text-orange-400"
                  title="複製"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <MenuEditor steps={steps} onChange={onChange} />

      {steps.length > 0 && (
        <div className="flex gap-2 items-end pt-2 border-t border-white/8">
          <input
            type="text"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="テンプレート名..."
            className="flex-1 bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <Button type="button" size="sm" variant="outline" className="border-white/10 shrink-0" onClick={handleSave} disabled={!templateName.trim()}>
            保存
          </Button>
        </div>
      )}
    </div>
  )
}
