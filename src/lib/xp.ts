export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2400, 3300, 4500]
export const LEVEL_ICONS = ['🐣', '🐥', '🌱', '🌿', '⭐', '🌟', '💫', '🔥', '💎', '👑']

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function levelIcon(level: number): string {
  return LEVEL_ICONS[Math.min(level - 1, LEVEL_ICONS.length - 1)]
}

export function xpForCorrect(streak: number): number {
  if (streak >= 10) return 20
  if (streak >= 5) return 15
  return 10
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = getLevel(xp)
  const from = LEVEL_THRESHOLDS[level - 1]
  const to = LEVEL_THRESHOLDS[level] ?? from + 1500
  const current = xp - from
  const needed = to - from
  return { level, current, needed, pct: Math.round((current / needed) * 100) }
}
