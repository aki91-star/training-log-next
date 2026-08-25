'use client'

import { useState } from 'react'
import { Download, Upload, Info, ChevronRight, Check, Trash2, Copy } from 'lucide-react'
import { exerciseMaster, isRowCompleted } from '@/lib/data'
import AuthSection from '@/components/auth-section'
import { useWorkoutStore, HYROX_OFFICIAL_MENU_ID } from '@/lib/workout-store'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
      {children}
    </p>
  )
}

function SettingRow({
  icon, label, sublabel, onClick, right,
}: {
  icon: React.ReactNode; label: string; sublabel?: string
  onClick?: () => void; right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#1a1a1a] px-4 py-3.5 text-left hover:bg-[#222] transition-colors"
    >
      <span className="text-orange-400 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      {right ?? <ChevronRight size={16} className="text-gray-600 shrink-0" />}
    </button>
  )
}

export default function SettingsPane() {
  const [exportDone, setExportDone] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [monthlyGoal, setMonthlyGoal] = useState('14')
  const {
    sessions,
    menuTemplates,
    activeRun,
    deleteMenuTemplate,
    duplicateMenuTemplate,
  } = useWorkoutStore()

  // Note: import would need store setters exposed — using window reload after localStorage write
  function handleImportData(data: {
    sessions?: typeof sessions
    menuTemplates?: typeof menuTemplates
  }) {
    if (data.sessions) {
      localStorage.setItem('training-log:sessions', JSON.stringify(data.sessions))
    }
    if (data.menuTemplates) {
      localStorage.setItem('training-log:menu-templates', JSON.stringify(data.menuTemplates))
    }
    window.location.reload()
  }

  function handleExport() {
    const data = {
      schemaVersion: '1.1.0',
      appMeta: { name: 'training-log', exportedAt: new Date().toISOString() },
      exerciseMaster,
      sessions,
      menuTemplates,
      activeRun,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `training-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string)
          handleImportData(data)
          setImportDone(true)
        } catch {
          alert('JSONファイルの読み込みに失敗しました')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const totalSets = sessions
    .flatMap(s => s.blocks.flatMap(b => b.rows))
    .filter(isRowCompleted).length

  return (
    <div className="space-y-6 pb-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'セッション', value: sessions.length },
          { label: 'メニュー', value: menuTemplates.length },
          { label: '完了セット', value: totalSets },
        ].map(item => (
          <div key={item.label} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3 text-center">
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div>
        <SectionTitle>アカウント</SectionTitle>
        <AuthSection />
      </div>

      <div>
        <SectionTitle>保存済みメニュー</SectionTitle>
        <div className="space-y-2">
          {menuTemplates.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.name}</p>
                <p className="text-[10px] text-gray-500">{t.steps.length} ステップ</p>
              </div>
              <button type="button" onClick={() => duplicateMenuTemplate(t.id)} className="p-1.5 text-gray-500 hover:text-orange-400" title="複製">
                <Copy size={14} />
              </button>
              {t.id !== HYROX_OFFICIAL_MENU_ID && (
                <button type="button" onClick={() => deleteMenuTemplate(t.id)} className="p-1.5 text-gray-500 hover:text-red-400" title="削除">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>個人設定</SectionTitle>
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-gray-500">月間目標トレーニング日数</span>
            <input
              type="number"
              min={1}
              max={31}
              value={monthlyGoal}
              onChange={e => setMonthlyGoal(e.target.value)}
              className="mt-1.5 w-full bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/40"
            />
          </label>
          <p className="text-[11px] text-gray-600">※ 現状はUIのみ（永続化は今後対応）</p>
        </div>
      </div>

      <div>
        <SectionTitle>バックアップ</SectionTitle>
        <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/8">
          <SettingRow
            icon={<Download size={18} />} label="JSONエクスポート"
            sublabel="全データを1ファイルで書き出し" onClick={handleExport}
            right={exportDone ? <Check size={16} className="text-green-400" /> : <ChevronRight size={16} className="text-gray-600" />}
          />
          <SettingRow
            icon={<Upload size={18} />} label="JSONインポート"
            sublabel="バックアップファイルから復元" onClick={handleImport}
            right={importDone ? <Check size={16} className="text-green-400" /> : <ChevronRight size={16} className="text-gray-600" />}
          />
        </div>
      </div>

      <div>
        <SectionTitle>アプリ情報</SectionTitle>
        <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/8">
          <SettingRow
            icon={<Info size={18} />} label="推定1RM計算式"
            sublabel="Epley法：重量 × (1 + 回数 / 30)"
            right={<span className="text-xs text-gray-600">固定</span>}
          />
        </div>
        <p className="text-center text-xs text-gray-700 mt-4">training-log · v0.4.0 · ラップ連携</p>
      </div>
    </div>
  )
}
