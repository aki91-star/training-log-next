'use client'

let audioContext: AudioContext | null = null

/** 開始ボタン等のユーザー操作内で呼び、ブラウザの自動再生制限を解除する */
export function unlockTimerAudio() {
  if (typeof window === 'undefined') return
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

function ringAlarm() {
  if (!audioContext) return

  const ctx = audioContext
  const now = ctx.currentTime
  const tones = [880, 660, 880]

  for (let i = 0; i < tones.length; i++) {
    const start = now + i * 0.55
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = tones[i]
    osc.type = 'sine'
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.35, start + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42)
    osc.start(start)
    osc.stop(start + 0.45)
  }

  navigator.vibrate?.([180, 90, 180, 90, 180])
}

/** タイマー終了時にビープ音を鳴らす（Web Audio API） */
export function playTimerAlarm(enabled = true) {
  if (!enabled) return
  unlockTimerAudio()
  ringAlarm()
}

/** 設定画面から通知音を試聴する */
export function previewTimerAlarm() {
  unlockTimerAudio()
  ringAlarm()
}
