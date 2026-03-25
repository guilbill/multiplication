import { useGame } from '../context/GameContext'
import { multMasteryStats, conjMasteryStats } from '../lib/spacedRepetition'

export default function SubjectScreen() {
  const { state, dispatch, save } = useGame()
  const { pct: multPct } = multMasteryStats(state.multProgress)
  const { pct: conjPct } = conjMasteryStats(state.conjProgress)

  function goHome() {
    save()
    dispatch({ type: 'NAVIGATE', screen: 'profile' })
  }

  return (
    <>
      <p className="page-title">👤 {state.profile}</p>
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
      </div>
      <button className="change-player-btn" onClick={goHome}>
        🏠 Changer de joueur
      </button>
    </>
  )
}
