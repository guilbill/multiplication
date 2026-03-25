import { useGame } from '../context/GameContext'
import { conjMasteryStats, MASTERED_THRESHOLD } from '../lib/spacedRepetition'
import { SENTENCES } from '../data/sentences'
import type { ConjEnding } from '../types'

const ENDINGS: ConjEnding[] = ['é', 'er', 'ait', 'aient']
const COLORS: Record<ConjEnding, string> = {
  é:     '#ff6b6b',
  er:    '#20c997',
  ait:   '#ffd43b',
  aient: '#74c0fc',
}

export default function ConjProgress() {
  const { state, dispatch } = useGame()
  const { mastered, total, pct } = conjMasteryStats(state.conjProgress)

  const hardest = Object.entries(state.conjProgress)
    .filter(([, w]) => w > 1.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([i]) => SENTENCES[+i])

  return (
    <>
      <p className="page-title">📊 Conjugaison — Progrès</p>
      <div className="card">
        <p className="prog-summary">
          ⭐ {mastered} / {total} phrases maîtrisées ({pct}%)
        </p>

        {/* Per-ending bars */}
        <div style={{ margin: '16px 0' }}>
          {ENDINGS.map(ans => {
            const indices = SENTENCES.flatMap((s, i) => (s.ans === ans ? [i] : []))
            const count   = indices.length
            const done    = indices.filter(i => (state.conjProgress[i] ?? 1) <= MASTERED_THRESHOLD).length
            const barPct  = Math.round((done / count) * 100)
            return (
              <div key={ans} className="cbar-row">
                <div className="cbar-label" style={{ color: COLORS[ans] }}>…{ans}</div>
                <div className="cbar-track">
                  <div className="cbar-fill" style={{ width: `${barPct}%`, background: COLORS[ans] }} />
                </div>
                <div className="cbar-pct">{done}/{count}</div>
              </div>
            )
          })}
        </div>

        {/* Hardest sentences */}
        {hardest.length > 0 && (
          <>
            <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 8 }}>
              Plus difficiles :
            </p>
            {hardest.map((s, i) => (
              <div key={i} className="hard-item">
                {s.b}<span className="hard-ans">{s.ans}</span>{s.a}
              </div>
            ))}
          </>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 18 }}
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'conj-game' })}
        >
          ← Continuer
        </button>
      </div>
    </>
  )
}
