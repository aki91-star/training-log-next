'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import MenuEditor from '@/components/menu-editor'
import MenuPicker from '@/components/menu-picker'
import type { LapStep } from '@/lib/workout-types'

export default function LapMenuSetup({
  steps,
  onChange,
  onStartTimer,
  readOnly = false,
  linkedTimerRunId,
  isMeasuring = false,
}: {
  steps: LapStep[]
  onChange: (steps: LapStep[]) => void
  onStartTimer: () => void
  readOnly?: boolean
  linkedTimerRunId?: string
  isMeasuring?: boolean
}) {
  const [showMenuPicker, setShowMenuPicker] = useState(false)

  const menuSummary = steps.map((s, i) => `${i + 1}. ${s.label}`).join(' → ')

  if (readOnly) {
    return (
      <div className="space-y-2">
        {steps.length > 0 ? (
          <p className="text-xs text-gray-400 truncate" title={menuSummary}>
            {menuSummary}
          </p>
        ) : (
          <p className="text-xs text-gray-500">未設定</p>
        )}
        <p className="text-xs text-gray-500">計測中はラップメニューを編集できません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {steps.length === 0 && (
        <div className="text-center py-2 space-y-1">
          <p className="text-sm text-gray-400">ラップメニューが未設定です</p>
          <p className="text-xs text-gray-500">
            テンプレートを選ぶか、ステップを追加して計測の準備をしましょう
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowMenuPicker(v => !v)}
          className="text-xs text-orange-400 hover:text-orange-300"
        >
          {showMenuPicker ? 'エディタに戻る' : 'テンプレートから選ぶ'}
        </button>
      </div>

      {showMenuPicker ? (
        <MenuPicker steps={steps} onChange={onChange} />
      ) : (
        <MenuEditor steps={steps} onChange={onChange} />
      )}

      {steps.length > 0 && (
        <p className="text-xs text-gray-500 truncate" title={menuSummary}>
          {menuSummary}
        </p>
      )}

      <button
        type="button"
        onClick={onStartTimer}
        disabled={steps.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold py-3 rounded-xl transition-colors min-h-11"
      >
        <Play size={16} /> 計測開始
      </button>

      {linkedTimerRunId && !isMeasuring && (
        <p className="text-xs text-green-400/80 text-center">
          ラップ計測データが記録に反映されています
        </p>
      )}
    </div>
  )
}
