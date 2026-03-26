import { SENTENCES } from '../data/sentences'
import type { MultMode, ConjMode, MultQuestion, Sentence } from '../types'

// ── Weights ────────────────────────────────────────────────
export const WEIGHT_CORRECT = 0.72
export const WEIGHT_WRONG   = 2.4
export const WEIGHT_MIN     = 0.25
export const WEIGHT_MAX     = 12
export const MASTERED_THRESHOLD = 0.6

export function applyCorrect(w: number) { return Math.max(WEIGHT_MIN, w * WEIGHT_CORRECT) }
export function applyWrong(w: number)   { return Math.min(WEIGHT_MAX, w * WEIGHT_WRONG) }

// ── Multiplication ─────────────────────────────────────────
export function mkey(a: number, b: number) { return `${a}x${b}` }

export function initMultProgress(saved: Record<string, number>): Record<string, number> {
  const p: Record<string, number> = {}
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++) {
      const k = mkey(a, b)
      p[k] = saved[k] ?? 1.0
    }
  return p
}

function weightedPick<T>(pool: [T, number][]): T {
  const total = pool.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [item, w] of pool) {
    r -= w
    if (r <= 0) return item
  }
  return pool[pool.length - 1][0]
}

const EASY_TABLES = new Set([1, 2, 5, 10])

export function pickFact(progress: Record<string, number>, mode: MultMode): string {
  const all = Object.entries(progress) as [string, number][]
  const filtered = all.filter(([k]) => {
    if (mode === 'all') return true
    if (mode === 'weak') return progress[k] > 1.5
    if (mode === 'skip-easy') {
      const [a, b] = k.split('x').map(Number)
      return !EASY_TABLES.has(a) && !EASY_TABLES.has(b)
    }
    const [a, b] = k.split('x').map(Number)
    return a === mode || b === mode
  })
  return weightedPick(filtered.length ? filtered : all)
}

export function makeProductChoices(a: number, b: number): number[] {
  const correct = a * b
  const cands = new Set<number>()
  for (let j = 1; j <= 10; j++) cands.add(a * j)
  for (let i = 1; i <= 10; i++) cands.add(i * b)
  cands.delete(correct)
  const pool = [...cands].sort(() => Math.random() - .5)
  return [correct, ...pool.slice(0, 3)].sort(() => Math.random() - .5)
}

function makeFactorChoices(answer: number): number[] {
  const others = Array.from({ length: 10 }, (_, i) => i + 1).filter(n => n !== answer)
  others.sort((x, y) => Math.abs(x - answer) - Math.abs(y - answer))
  return [answer, ...others.slice(0, 5).sort(() => Math.random() - .5).slice(0, 3)]
    .sort(() => Math.random() - .5)
}

export function generateMultQuestion(
  progress: Record<string, number>,
  mode: MultMode,
): MultQuestion {
  const k = pickFact(progress, mode)
  const [a, b] = k.split('x').map(Number)
  const c = a * b
  const types = ['product', 'factorA', 'factorB'] as const
  const type = types[Math.floor(Math.random() * types.length)]

  if (type === 'product') {
    return {
      k,
      parts: [{ t: `${a}` }, { t: '×' }, { t: `${b}` }, { t: '=' }, { t: '?', blank: true }],
      answer: c,
      choices: makeProductChoices(a, b),
    }
  }
  if (type === 'factorA') {
    return {
      k,
      parts: [{ t: '?', blank: true }, { t: '×' }, { t: `${b}` }, { t: '=' }, { t: `${c}` }],
      answer: a,
      choices: makeFactorChoices(a),
    }
  }
  return {
    k,
    parts: [{ t: `${a}` }, { t: '×' }, { t: '?', blank: true }, { t: '=' }, { t: `${c}` }],
    answer: b,
    choices: makeFactorChoices(b),
  }
}

export function multMasteryStats(progress: Record<string, number>) {
  const vals = Object.values(progress)
  if (!vals.length) return { mastered: 0, total: 100, pct: 0 }
  const mastered = vals.filter(w => w <= MASTERED_THRESHOLD).length
  return { mastered, total: vals.length, pct: Math.round((mastered / vals.length) * 100) }
}

// ── Conjugaison ────────────────────────────────────────────
export function initConjProgress(saved: Record<number, number>): Record<number, number> {
  const p: Record<number, number> = {}
  for (let i = 0; i < SENTENCES.length; i++)
    p[i] = saved[i] ?? 1.0
  return p
}

export function pickSentence(progress: Record<number, number>, mode: ConjMode): number {
  const all = Object.entries(progress).map(([k, w]) => [+k, w] as [number, number])
  const filtered = all.filter(([idx]) => mode === 'all' || SENTENCES[idx].ans === mode)
  return weightedPick(filtered.length ? filtered : all)
}

export function bossConjQuestions(progress: Record<number, number>, count = 6): Sentence[] {
  const sorted = Object.entries(progress)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .sort(() => Math.random() - 0.5)
  return sorted.map(([k]) => SENTENCES[+k])
}

export function bossQuestions(progress: Record<string, number>, count = 10): MultQuestion[] {
  const sorted = Object.entries(progress)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .sort(() => Math.random() - 0.5)  // shuffle order
  return sorted.map(([k]) => {
    const [a, b] = k.split('x').map(Number)
    return {
      k,
      parts: [{ t: `${a}` }, { t: '×' }, { t: `${b}` }, { t: '=' }, { t: '?', blank: true }],
      answer: a * b,
      choices: makeProductChoices(a, b),
    }
  })
}

export function conjMasteryStats(progress: Record<number, number>) {
  const vals = Object.values(progress)
  if (!vals.length) return { mastered: 0, total: SENTENCES.length, pct: 0 }
  const mastered = vals.filter(w => w <= MASTERED_THRESHOLD).length
  return { mastered, total: vals.length, pct: Math.round((mastered / vals.length) * 100) }
}
