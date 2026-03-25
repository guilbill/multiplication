import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import { loadProfiles, loadProgress } from '../lib/api'
import { multMasteryStats } from '../lib/spacedRepetition'

export default function ProfileScreen() {
  const { dispatch } = useGame()
  const [rows, setRows] = useState<{ name: string; pct: number }[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    ;(async () => {
      const names = await loadProfiles()
      const loaded = await Promise.all(
        names.map(async name => {
          const { multProgress } = await loadProgress(name)
          const { pct } = multMasteryStats(multProgress)
          return { name, pct }
        }),
      )
      setRows(loaded)
    })()
  }, [])

  async function selectProfile(name: string) {
    const { multProgress, conjProgress } = await loadProgress(name)
    dispatch({ type: 'LOAD_PLAYER', profile: name, multProgress, conjProgress })
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
            rows.map(({ name, pct }) => (
              <button key={name} className="profile-btn" onClick={() => selectProfile(name)}>
                👤 {name}
                <span className="mastery-pill">🔢 {pct}%</span>
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
