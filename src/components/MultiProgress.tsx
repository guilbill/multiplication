import { useGame } from '../context/GameContext'
import { multMasteryStats, mkey } from '../lib/spacedRepetition'

function cellColor(w: number): string {
  if (w <= 0.6) return '#40c057'
  if (w <= 0.9) return '#94d82d'
  if (w <= 1.4) return '#ffd43b'
  if (w <= 3.0) return '#ff922b'
  return '#fa5252'
}

export default function MultiProgress() {
  const { state, dispatch } = useGame()
  const { mastered, total, pct } = multMasteryStats(state.multProgress)

  const hardest = Object.entries(state.multProgress)
    .filter(([, w]) => w > 1.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => {
      const [a, b] = k.split('x').map(Number)
      return `${a}×${b}=${a * b}`
    })

  const summary =
    `⭐ ${mastered} / ${total} maîtrisés (${pct}%)` +
    (hardest.length ? `  ·  À travailler : ${hardest.join(', ')}` : '')

  return (
    <>
      <p className="page-title">📊 Tables — Progrès</p>
      <div className="card">
        <p className="prog-summary">{summary}</p>
        <div className="prog-grid-wrap">
          <div className="prog-grid">
            {/* Header row */}
            <div />
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="pg-head">{i + 1}</div>
            ))}
            {/* Data rows */}
            {Array.from({ length: 10 }, (_, ai) => {
              const a = ai + 1
              return (
                <>
                  <div key={`h${a}`} className="pg-head">{a}</div>
                  {Array.from({ length: 10 }, (_, bi) => {
                    const b = bi + 1
                    const w = state.multProgress[mkey(a, b)] ?? 1.0
                    return (
                      <div
                        key={`${a}x${b}`}
                        className="pg-cell"
                        style={{ background: cellColor(w) }}
                        title={`${a}×${b}=${a * b}`}
                      />
                    )
                  })}
                </>
              )
            })}
          </div>
        </div>
        <div className="legend">
          {[
            ['#40c057', 'Maîtrisé'],
            ['#94d82d', 'Bon'],
            ['#ffd43b', 'À revoir'],
            ['#ff922b', 'Difficile'],
            ['#fa5252', 'Très difficile'],
            ['#dee2e6', 'Nouveau'],
          ].map(([color, label]) => (
            <span key={label}>
              <span className="legend-dot" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 18 }}
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'mult-game' })}
        >
          ← Continuer
        </button>
      </div>
    </>
  )
}
