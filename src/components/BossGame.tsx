import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { bossQuestions } from '../lib/spacedRepetition'
import { playCorrect, playWrong } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'

const BOSS_HP      = 10
const PLAYER_HP    = 5
const QUESTION_SEC = 5

export default function BossGame() {
  const { state, dispatch, save } = useGame()
  const [questions]  = useState(() => bossQuestions(state.multProgress))

  // ── Render state ───────────────────────────────────────────
  const [qIdx,       setQIdx]       = useState(0)
  const [bossHp,     setBossHp]     = useState(BOSS_HP)
  const [playerHp,   setPlayerHp]   = useState(PLAYER_HP)
  const [timer,      setTimer]      = useState(QUESTION_SEC)
  const [answering,  setAnswering]  = useState(false)
  const [phase,      setPhase]      = useState<'playing' | 'won' | 'lost'>('playing')
  const [xpEarned,   setXpEarned]   = useState(0)
  const [hitEffect,  setHitEffect]  = useState<'boss' | 'player' | null>(null)

  // ── Refs for stale-closure safety ─────────────────────────
  const bossHpRef    = useRef(BOSS_HP)
  const playerHpRef  = useRef(PLAYER_HP)
  const qIdxRef      = useRef(0)
  const answeringRef = useRef(false)
  const streakRef    = useRef(0)
  const xpRef        = useRef(0)
  const hitTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  useEffect(() => () => {
    if (hitTimerRef.current) clearTimeout(hitTimerRef.current)
  }, [])

  // ── Timer countdown ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'playing' || answering) return
    if (timer <= 0) { handleWrong(); return }
    const t = setTimeout(() => setTimer(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, phase, answering])

  // ── Game logic ─────────────────────────────────────────────
  function advance(newBossHp: number, newPlayerHp: number) {
    const nextIdx = qIdxRef.current + 1
    qIdxRef.current = nextIdx

    if (newBossHp <= 0)                  { setPhase('won');  save(); return }
    if (newPlayerHp <= 0)                { setPhase('lost'); save(); return }
    if (nextIdx >= questions.length)     { setPhase(newBossHp < BOSS_HP ? 'won' : 'lost'); save(); return }

    setQIdx(nextIdx)
    answeringRef.current = false
    setAnswering(false)
    setTimer(QUESTION_SEC)
  }

  function handleWrong() {
    if (answeringRef.current) return
    answeringRef.current = true
    streakRef.current = 0
    setAnswering(true)
    playWrong()
    setHitEffect('player')
    const newHp = Math.max(0, playerHpRef.current - 1)
    playerHpRef.current = newHp
    setPlayerHp(newHp)
    hitTimerRef.current = setTimeout(() => {
      setHitEffect(null)
      advance(bossHpRef.current, newHp)
    }, 900)
  }

  function handleAnswer(val: number) {
    if (answeringRef.current || phase !== 'playing') return
    if (val !== questions[qIdxRef.current].answer) { handleWrong(); return }

    answeringRef.current = true
    streakRef.current++
    setAnswering(true)
    playCorrect()
    const gained = xpForCorrect(streakRef.current)
    xpRef.current += gained
    setXpEarned(xpRef.current)
    dispatch({ type: 'ADD_XP', amount: gained })
    setHitEffect('boss')
    const newHp = Math.max(0, bossHpRef.current - 2)
    bossHpRef.current = newHp
    setBossHp(newHp)
    hitTimerRef.current = setTimeout(() => {
      setHitEffect(null)
      advance(newHp, playerHpRef.current)
    }, 700)
  }

  function leave() { dispatch({ type: 'NAVIGATE', screen: 'subject' }) }

  // ── Result screens ─────────────────────────────────────────
  if (phase !== 'playing') {
    const won = phase === 'won'
    return (
      <>
        {levelUp && <LevelUpOverlay level={levelUp} onDone={clearLevelUp} />}
        <div className={`boss-result ${phase}`}>
          <div className="boss-result-icon">{won ? '🏆' : '💀'}</div>
          <h2>{won ? 'Victoire !' : 'Défaite…'}</h2>
          <p>{won ? 'Tu as vaincu le boss !' : 'Entraîne-toi et reviens !'}</p>
          <div className="boss-xp">+{xpEarned} XP</div>
          <button className="btn-primary" onClick={leave}>
            {won ? '← Retour' : '← Réessayer'}
          </button>
        </div>
      </>
    )
  }

  // ── Playing ────────────────────────────────────────────────
  const q           = questions[qIdx]
  const bossHpPct   = Math.round((bossHp   / BOSS_HP)   * 100)
  const playerHpPct = Math.round((playerHp / PLAYER_HP) * 100)
  const timerPct    = Math.round((timer    / QUESTION_SEC) * 100)

  return (
    <>
      {levelUp && <LevelUpOverlay level={levelUp} onDone={clearLevelUp} />}

      <div className="game-topbar">
        <button className="topbar-btn" onClick={leave}>✕ Quitter</button>
        <span className="profile-name">⚔️ Boss Fight</span>
        <span style={{ width: 80 }} />
      </div>

      <div className="card">
        {/* Boss entity */}
        <div className={`boss-entity${hitEffect === 'boss' ? ' hit' : ''}`}>
          <div className="boss-emoji">🐉</div>
          <div className="boss-hp-wrap">
            <div className="boss-hp-label"><span>Boss</span><span>{bossHp}/{BOSS_HP}</span></div>
            <div className="boss-hp-track">
              <div className="boss-hp-fill" style={{ width: `${bossHpPct}%` }} />
            </div>
          </div>
        </div>

        {/* Player HP */}
        <div className={`player-hp-wrap${hitEffect === 'player' ? ' hit' : ''}`}>
          <div className="boss-hp-label"><span>⚔️ Toi</span><span>{playerHp}/{PLAYER_HP}</span></div>
          <div className="boss-hp-track">
            <div className="player-hp-fill" style={{ width: `${playerHpPct}%` }} />
          </div>
        </div>

        {/* Timer bar */}
        <div className="boss-timer-wrap">
          <div
            className={`boss-timer-bar${timer <= 2 ? ' urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question */}
        <div className="question-wrap">
          <div className="question-eq">
            {q.parts.map((p, i) =>
              p.blank
                ? <span key={i} className="q-blank">?</span>
                : <span key={i}>{p.t}</span>
            )}
          </div>
        </div>

        {/* Answer buttons */}
        <div className="answer-grid">
          {q.choices.map((c, i) => (
            <button
              key={c}
              className={`ans-btn color-${(i % 4) + 1}`}
              disabled={answering}
              onClick={() => handleAnswer(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="boss-progress-note">
          Question {qIdx + 1} / {questions.length}
        </div>
      </div>
    </>
  )
}
