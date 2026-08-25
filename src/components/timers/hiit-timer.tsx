'use client'

import { useRef, useState } from 'react'
import { Pause, Play, Plus, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatCountdown } from '@/lib/format-time'
import { useInterval } from '@/lib/use-interval'

const DEFAULT_HIIT = { work: 40, rest: 20, rounds: 8, prepare: 10 }

function nowMs() {
  return performance.now()
}

type HiitPhase = 'prepare' | 'work' | 'rest' | 'done'

export default function HiitTimer() {
  const [work, setWork] = useState(DEFAULT_HIIT.work)
  const [rest, setRest] = useState(DEFAULT_HIIT.rest)
  const [rounds, setRounds] = useState(DEFAULT_HIIT.rounds)
  const [prepare, setPrepare] = useState(DEFAULT_HIIT.prepare)
  const [phase, setPhase] = useState<HiitPhase>('prepare')
  const [round, setRound] = useState(1)
  const [remaining, setRemaining] = useState(DEFAULT_HIIT.prepare)
  const [running, setRunning] = useState(false)
  const endAtRef = useRef<number | null>(null)

  const phaseDuration =
    phase === 'prepare' ? prepare : phase === 'work' ? work : phase === 'rest' ? rest : 0

  function advancePhase() {
    if (phase === 'prepare') {
      setPhase('work')
      setRemaining(work)
      if (running) endAtRef.current = nowMs() + work * 1000
      return
    }
    if (phase === 'work') {
      if (round >= rounds) {
        setPhase('done')
        setRunning(false)
        endAtRef.current = null
        setRemaining(0)
        return
      }
      setPhase('rest')
      setRemaining(rest)
      if (running) endAtRef.current = nowMs() + rest * 1000
      return
    }
    if (phase === 'rest') {
      const nextRound = round + 1
      setRound(nextRound)
      setPhase('work')
      setRemaining(work)
      if (running) endAtRef.current = nowMs() + work * 1000
    }
  }

  useInterval(() => {
    if (!running || endAtRef.current === null || phase === 'done') return
    const left = Math.max(0, (endAtRef.current - nowMs()) / 1000)
    setRemaining(left)
    if (left <= 0) advancePhase()
  }, running ? 100 : null)

  function start() {
    setPhase('prepare')
    setRound(1)
    setRemaining(prepare)
    endAtRef.current = nowMs() + prepare * 1000
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
    setPhase('prepare')
    setRound(1)
    setRemaining(prepare)
  }

  const phaseLabel = { prepare: '準備', work: 'ワーク', rest: 'レスト', done: '完了' }[phase]
  const progress = phaseDuration > 0 && phase !== 'done'
    ? ((phaseDuration - remaining) / phaseDuration) * 100
    : phase === 'done' ? 100 : 0

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-500">
        <SkipForward size={16} className="text-orange-400" />
        <span className="text-xs uppercase tracking-widest">HIIT インターバル</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs border-white/15 text-gray-400">{phaseLabel}</Badge>
        <span className="text-xs text-gray-500">Round {Math.min(round, rounds)} / {rounds}</span>
      </div>
      <p className="text-5xl font-bold tabular-nums text-center">
        {phase === 'done' ? 'FINISH' : formatCountdown(remaining)}
      </p>
      <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-orange-500" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        {([
          ['ワーク', work, setWork],
          ['レスト', rest, setRest],
          ['ラウンド', rounds, setRounds],
          ['準備', prepare, setPrepare],
        ] as const).map(([label, value, setter]) => (
          <label key={label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="text-gray-500">{label} (秒)</span>
            <input
              type="number"
              min={1}
              value={value}
              disabled={running}
              onChange={e => setter(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none disabled:opacity-50"
            />
          </label>
        ))}
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
      {running && phase !== 'done' && (
        <Button type="button" variant="outline" className="w-full border-white/10 bg-white/5" onClick={advancePhase}>
          <Plus size={16} /> フェーズをスキップ
        </Button>
      )}
    </div>
  )
}
