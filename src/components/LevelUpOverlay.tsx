import { useEffect } from 'react'
import { levelIcon } from '../lib/xp'

interface Props {
  level: number
  onDone: () => void
}

export default function LevelUpOverlay({ level, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="levelup-overlay" onClick={onDone}>
      <div className="levelup-card">
        <div className="levelup-badge">Niveau supérieur !</div>
        <div className="levelup-icon">{levelIcon(level)}</div>
        <div className="levelup-title">NIVEAU {level}</div>
        <div className="levelup-sub">Bravo, continue comme ça !</div>
      </div>
    </div>
  )
}
