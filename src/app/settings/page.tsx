'use client'

import { useState } from 'react'
import { Download, Upload, Info, ChevronRight, Check } from 'lucide-react'
import { mockSessions, exerciseMaster } from '@/lib/data'
import BottomNav from '@/components/bottom-nav'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-4 mb-2">
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

export default function SettingsPage() {
  const [exportDone, setExportDone] = useState(false)
  const [importDone, setImportDone] = useState(false)

  function handleExport() {
    const data = {
      schemaVersion: '1.0.0',
      appMeta: { name: 'training-log', exportedAt: new Date().toISOString() },
      exerciseMaster,
      sessions: mockSessions,
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
          JSON.parse(reader.result as string)
          setImportDone(true)
          setTimeout(() => setImportDone(false), 3000)
        } catch {
          alert('JSONファイルの読み込みに失敗しました')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const totalSets = mockSessions
    .flatMap(s => s.blocks.flatMap(b => b.rows))
    .filter(r => r.status === 'completed').length

  return (
    <div className="app-page">
      <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-sm border-b border-white/10 flex items-center h-12 px-4">
        <h1 className="text-sm font-semibold">設定 / バックアップ</h1>
      </div>

      <div className="pt-6 space-y-6">
        <div className="px-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'セッション',  value: mockSessions.length    },
              { label: '種目マスタ',  value: exerciseMaster.length  },
              { label: '完了セット',  value: totalSets              },
            ].map(item => (
              <div key={item.label} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>バックアップ</SectionTitle>
          <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/8 mx-4">
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
          <p className="text-[11px] text-gray-600 px-4 mt-2 leading-relaxed">
            エクスポートしたJSONはAIへの読み込みやバックアップとして使用できます。
          </p>
        </div>

        <div>
          <SectionTitle>アプリ情報</SectionTitle>
          <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/8 mx-4">
            <SettingRow
              icon={<Info size={18} />} label="推定1RM計算式"
              sublabel="Epley法：重量 × (1 + 回数 / 30)"
              right={<span className="text-xs text-gray-600">固定</span>}
            />
          </div>
        </div>

        <div className="px-4 text-center">
          <p className="text-xs text-gray-700">training-log · Next.js v0.2.0</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
