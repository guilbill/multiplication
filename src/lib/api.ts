import { initMultProgress, initConjProgress } from './spacedRepetition'

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
  try {
    const res = await fetch('/api/profiles')
    const data: unknown = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function loadProgress(profile: string): Promise<{
  multProgress: Record<string, number>
  conjProgress: Record<number, number>
}> {
  try {
    const res = await fetch(`/api/progress?profile=${encodeURIComponent(profile)}`)
    const raw: unknown = await res.json()
    const { mult, conj } = parseSaved(raw)
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
    await fetch(`/api/progress?profile=${encodeURIComponent(profile)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mult: multProgress, conj: conjProgress }),
    })
  } catch {
    // Best-effort save
  }
}
