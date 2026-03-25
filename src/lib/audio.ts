let _ctx: AudioContext | null = null

function getCtx() {
  return (_ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)())
}

function beep(freq: number, dur: number, delay = 0, type: OscillatorType = 'sine', vol = 0.28) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    const t0 = ctx.currentTime + delay
    gain.gain.setValueAtTime(vol, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.start(t0)
    osc.stop(t0 + dur + 0.01)
  } catch {
    // Silently ignore if audio context is unavailable
  }
}

export function playCorrect() {
  beep(523, 0.12)
  beep(659, 0.12, 0.1)
  beep(784, 0.18, 0.2)
}

export function playWrong() {
  beep(280, 0.12, 0, 'square', 0.2)
  beep(200, 0.22, 0.1, 'square', 0.18)
}

export function playStreak() {
  ;[523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.13, i * 0.09))
}
