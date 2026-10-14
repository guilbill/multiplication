import { initMultProgress, initConjProgress, initVerbConjProgress, initHomophoneProgress, initVocabProgress, initGridProgress, initCircleProgress } from './spacedRepetition'

const PREFIX = 'mm:progress:'

interface RawSaved {
  mult?: Record<string, number>
  conj?: Record<number, number>
  verbConj?: Record<number, number>
  homophone?: Record<number, number>
  vocab?: Record<number, number>
  grid?: Record<number, number>
  circle?: Record<number, number>
  xp?: number
  [key: string]: unknown
}

function parseSaved(raw: unknown): { mult: Record<string, number>; conj: Record<number, number>; verbConj: Record<number, number>; homophone: Record<number, number>; vocab: Record<number, number>; grid: Record<number, number>; circle: Record<number, number>; xp: number } {
  const obj = raw as RawSaved
  if (obj && typeof obj === 'object' && 'mult' in obj) {
    return {
      mult: (obj.mult ?? {}) as Record<string, number>,
      conj: (obj.conj ?? {}) as Record<number, number>,
      verbConj: (obj.verbConj ?? {}) as Record<number, number>,
      homophone: (obj.homophone ?? {}) as Record<number, number>,
      vocab: (obj.vocab ?? {}) as Record<number, number>,
      grid: (obj.grid ?? {}) as Record<number, number>,
      circle: (obj.circle ?? {}) as Record<number, number>,
      xp: typeof obj.xp === 'number' ? obj.xp : 0,
    }
  }
  // Old format: entire object is mult data
  return { mult: (raw ?? {}) as Record<string, number>, conj: {}, verbConj: {}, homophone: {}, vocab: {}, grid: {}, circle: {}, xp: 0 }
}

export async function loadProfiles(): Promise<string[]> {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .map(k => k.slice(PREFIX.length))
}

export async function loadProgress(profile: string): Promise<{
  multProgress: Record<string, number>
  conjProgress: Record<number, number>
  verbConjProgress: Record<number, number>
  homophoneProgress: Record<number, number>
  vocabProgress: Record<number, number>
  gridProgress: Record<number, number>
  circleProgress: Record<number, number>
  xp: number
}> {
  try {
    const raw = localStorage.getItem(PREFIX + profile)
    const { mult, conj, verbConj, homophone, vocab, grid, circle, xp } = parseSaved(raw ? JSON.parse(raw) : {})
    return {
      multProgress: initMultProgress(mult),
      conjProgress: initConjProgress(conj as Record<number, number>),
      verbConjProgress: initVerbConjProgress(verbConj as Record<number, number>),
      homophoneProgress: initHomophoneProgress(homophone as Record<number, number>),
      vocabProgress: initVocabProgress(vocab as Record<number, number>),
      gridProgress: initGridProgress(grid as Record<number, number>),
      circleProgress: initCircleProgress(circle as Record<number, number>),
      xp,
    }
  } catch {
    return {
      multProgress: initMultProgress({}),
      conjProgress: initConjProgress({}),
      verbConjProgress: initVerbConjProgress({}),
      homophoneProgress: initHomophoneProgress({}),
      vocabProgress: initVocabProgress({}),
      gridProgress: initGridProgress({}),
      circleProgress: initCircleProgress({}),
      xp: 0,
    }
  }
}

export async function saveProgress(
  profile: string,
  multProgress: Record<string, number>,
  conjProgress: Record<number, number>,
  verbConjProgress: Record<number, number>,
  homophoneProgress: Record<number, number>,
  vocabProgress: Record<number, number>,
  gridProgress: Record<number, number>,
  circleProgress: Record<number, number>,
  xp: number,
): Promise<void> {
  try {
    localStorage.setItem(PREFIX + profile, JSON.stringify({ mult: multProgress, conj: conjProgress, verbConj: verbConjProgress, homophone: homophoneProgress, vocab: vocabProgress, grid: gridProgress, circle: circleProgress, xp }))
  } catch {
    // Storage full or private browsing — progress not saved this time
  }
}
