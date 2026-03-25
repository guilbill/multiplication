import { initMultProgress, initConjProgress } from './spacedRepetition'

const PREFIX = 'mm:progress:'

interface RawSaved {
  mult?: Record<string, number>
  conj?: Record<number, number>
  xp?: number
  [key: string]: unknown
}

function parseSaved(raw: unknown): { mult: Record<string, number>; conj: Record<number, number>; xp: number } {
  const obj = raw as RawSaved
  if (obj && typeof obj === 'object' && 'mult' in obj) {
    return {
      mult: (obj.mult ?? {}) as Record<string, number>,
      conj: (obj.conj ?? {}) as Record<number, number>,
      xp: typeof obj.xp === 'number' ? obj.xp : 0,
    }
  }
  // Old format: entire object is mult data
  return { mult: (raw ?? {}) as Record<string, number>, conj: {}, xp: 0 }
}

export async function loadProfiles(): Promise<string[]> {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .map(k => k.slice(PREFIX.length))
}

export async function loadProgress(profile: string): Promise<{
  multProgress: Record<string, number>
  conjProgress: Record<number, number>
  xp: number
}> {
  try {
    const raw = localStorage.getItem(PREFIX + profile)
    const { mult, conj, xp } = parseSaved(raw ? JSON.parse(raw) : {})
    return {
      multProgress: initMultProgress(mult),
      conjProgress: initConjProgress(conj as Record<number, number>),
      xp,
    }
  } catch {
    return {
      multProgress: initMultProgress({}),
      conjProgress: initConjProgress({}),
      xp: 0,
    }
  }
}

export async function saveProgress(
  profile: string,
  multProgress: Record<string, number>,
  conjProgress: Record<number, number>,
  xp: number,
): Promise<void> {
  try {
    localStorage.setItem(PREFIX + profile, JSON.stringify({ mult: multProgress, conj: conjProgress, xp }))
  } catch {
    // Storage full or private browsing — progress not saved this time
  }
}
