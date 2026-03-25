import { useState, useEffect, useRef } from 'react'
import { getLevel } from '../lib/xp'

export function useLevelUp(xp: number): [number | null, () => void] {
  const [newLevel, setNewLevel] = useState<number | null>(null)
  const prevRef = useRef(getLevel(xp))

  useEffect(() => {
    const lvl = getLevel(xp)
    if (lvl > prevRef.current) setNewLevel(lvl)
    prevRef.current = lvl
  }, [xp])

  return [newLevel, () => setNewLevel(null)]
}
