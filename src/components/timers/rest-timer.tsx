'use client'

import { useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCountdown } from '@/lib/format-time'
import { useInterval } from '@/lib/use-interval'

const REST_PRESETS = [30, 60, 90, 120, 180, 300]

function nowMs() {
  return performance.now()
}

export default function RestTimer() {
  const [duration, setDuration] = useState(90)
  const [custom, setCustom] = useState('90')
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const endAtRef = useRef<number | null>(null)

  useInterval(() => {
    if (!running || endAtRef.current === null) return
    const left = Math.max(0, (endAtRef.current - nowMs()) / 1000)
    setRemaining(left)
    if (left <= 0) {
      setRunning(false)
      endAtRef.current = null
    }
  }, running ? 100 : null)

  function applyDuration(sec: number) {
    setDuration(sec)
    setCustom(String(sec))
    setRemaining(sec)
    setRunning(false)
    endAtRef.current = null
  }

  function start() {
    endAtRef.current = nowMs() + remaining * 1000
    setRunning(true)
  }

  function pause() {
    if (endAtRef.current !== null) {
      setRemaining(Math.max(0, (endAtRef.current - nowMs()) / 1000))
    }
    setRunning(false)
    endAtRef.current = null
  }

  function reset() {
    setRunning(false)
    endAtRef.current = null
    setRemaining(duration)
  }

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-500">
        <TimerIcon size={16} className="text-orange-400" />
        <span className="text-xs uppercase tracking-widest">休憩タイマー</span>
      </div>
      <p className="text-5xl font-bold tabular-nums text-center tracking-tight">
        {formatCountdown(remaining)}
      </p>
      <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-orange-500" />
      <div className="flex flex-wrap gap-2">
        {REST_PRESETS.map(sec => (
          <button
            key={sec}
            type="button"
            onClick={() => applyDuration(sec)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              duration === sec
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'bg-white/5 border border-white/10 text-gray-400'
            }`}
          >
            {sec >= 60 ? `${sec / 60}分` : `${sec}秒`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={5}
          value={custom}
          onChange={e => setCustom(e.target.value)}
          className="flex-1 bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <Button type="button" variant="outline" className="border-white/10 bg-white/5" onClick={() => applyDuration(Math.max(5, Number(custom) || 90))}>
          設定
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {!running ? (
          <Button type="button" className="col-span-2 bg-orange-500 hover:bg-orange-400" onClick={start}>
            <Play size={16} /> 開始
          </Button>
        ) : (
          <Button type="button" className="col-span-2 bg-white/10 hover:bg-white/15" onClick={pause}>
            <Pause size={16} /> 一時停止
          </Button>
        )}
        <Button type="button" variant="outline" className="border-white/10 bg-white/5" onClick={reset}>
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  )
}
