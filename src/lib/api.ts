import { initMultProgress, initConjProgress } from './spacedRepetition'

const PREFIX = 'mm:progress:'

interface RawSaved {
  mult?: Record<string, number>
  conj?: Record<number, number>
  [key: string]: unknown
}

function parseSaved(raw: unknown): { mult: Record<string, number>; conj: Record<number, number> } {
  const obj = raw as RawSaved
  if (obj && typeof obj === 'object' && 'mult' in obj) {
    return { mult: (obj.mult ?? {}) as Record<string, number>, conj: (obj.conj ?? {}) as Record<number, number> }
  }
  // Old format: entire object is mult data
  return { mult: (raw ?? {}) as Record<string, number>, conj: {} }
}

export async function loadProfiles(): Promise<string[]> {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .map(k => k.slice(PREFIX.length))
}

export async function loadProgress(profile: string): Promise<{
  multProgress: Record<string, number>
  conjProgress: Record<number, number>
}> {
  try {
    const raw = localStorage.getItem(PREFIX + profile)
    const { mult, conj } = parseSaved(raw ? JSON.parse(raw) : {})
    return {
      multProgress: initMultProgress(mult),
      conjProgress: initConjProgress(conj as Record<number, number>),
    }
  } catch {
    return {
      multProgress: initMultProgress({}),
      conjProgress: initConjProgress({}),
    }
  }
}

export async function saveProgress(
  profile: string,
  multProgress: Record<string, number>,
  conjProgress: Record<number, number>,
): Promise<void> {
  try {
    localStorage.setItem(PREFIX + profile, JSON.stringify({ mult: multProgress, conj: conjProgress }))
  } catch {
    // Storage full or private browsing — progress not saved this time
  }
}
