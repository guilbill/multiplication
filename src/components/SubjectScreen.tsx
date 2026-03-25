import { useGame } from '../context/GameContext'
import { multMasteryStats, conjMasteryStats } from '../lib/spacedRepetition'
import { levelProgress, levelIcon } from '../lib/xp'

export default function SubjectScreen() {
  const { state, dispatch, save } = useGame()
  const { pct: multPct } = multMasteryStats(state.multProgress)
  const { pct: conjPct } = conjMasteryStats(state.conjProgress)
  const { level, current, needed, pct: xpPct } = levelProgress(state.xp)

  function goHome() {
    save()
    dispatch({ type: 'NAVIGATE', screen: 'profile' })
  }

  return (
    <>
      <p className="page-title">👤 {state.profile}</p>

      {/* XP bar */}
      <div className="xp-bar-wrap">
        <div className="xp-bar-header">
          <span>{levelIcon(level)} Niveau {level}</span>
          <span className="xp-level-badge">{current} / {needed} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="subject-cards">
        <button
          className="subject-card mult"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'mult-game' })}
        >
          <span className="subject-icon">🔢</span>
          <span className="subject-info">
            <span className="subject-label">Tables de multiplication</span>
            <span className="subject-sub">1×1 jusqu'à 10×10</span>
          </span>
          <span className="subject-pct">⭐ {multPct}%</span>
        </button>

        <button
          className="subject-card conj"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'conj-game' })}
        >
          <span className="subject-icon">📝</span>
          <span className="subject-info">
            <span className="subject-label">Conjugaison</span>
            <span className="subject-sub">é · er · ait · aient</span>
          </span>
          <span className="subject-pct">⭐ {conjPct}%</span>
        </button>

        <button
          className="subject-card boss"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'boss-game' })}
        >
          <span className="subject-icon">🐉</span>
          <span className="subject-info">
            <span className="subject-label">Boss Fight</span>
            <span className="subject-sub">10 questions · chrono · tables</span>
          </span>
          <span className="subject-pct">⚔️ Go !</span>
        </button>
      </div>

      <button className="change-player-btn" onClick={goHome}>
        🏠 Changer de joueur
      </button>
    </>
  )
}
