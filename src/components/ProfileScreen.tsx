import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import { loadProfiles, loadProgress } from '../lib/api'
import { multMasteryStats } from '../lib/spacedRepetition'
import { getLevel, levelIcon } from '../lib/xp'

export default function ProfileScreen() {
  const { dispatch } = useGame()
  const [rows, setRows] = useState<{ name: string; pct: number; level: number }[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    ;(async () => {
      const names = await loadProfiles()
      const loaded = await Promise.all(
        names.map(async name => {
          const { multProgress, xp } = await loadProgress(name)
          const { pct } = multMasteryStats(multProgress)
          return { name, pct, level: getLevel(xp) }
        }),
      )
      setRows(loaded)
    })()
  }, [])

  async function selectProfile(name: string) {
    const { multProgress, conjProgress, verbConjProgress, xp } = await loadProgress(name)
    dispatch({ type: 'LOAD_PLAYER', profile: name, multProgress, conjProgress, verbConjProgress, xp })
    dispatch({ type: 'NAVIGATE', screen: 'subject' })
  }

  function handleGo() {
    const name = newName.trim()
    if (!name) return
    setNewName('')
    selectProfile(name)
  }

  return (
    <>
      <p className="page-title">🎓 Apprendre en jouant</p>
      <div className="card">
        <div className="profile-list">
          {rows.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem', padding: '8px 0' }}>
              Aucun joueur encore — commence !
            </p>
          ) : (
            rows.map(({ name, pct, level }) => (
              <button key={name} className="profile-btn" onClick={() => selectProfile(name)}>
                {levelIcon(level)} {name}
                <span className="mastery-pill">🔢 {pct}% · Niv.{level}</span>
              </button>
            ))
          )}
        </div>
        <div className="divider">nouveau joueur</div>
        <div className="new-profile-row">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            placeholder="Prénom..."
            maxLength={20}
            autoComplete="off"
          />
          <button className="btn-go" onClick={handleGo}>
            Go !
          </button>
        </div>
      </div>
    </>
  )
}
