import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  pickSentence,
  conjMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import { SENTENCES } from '../data/sentences'
import type { ConjEnding, ConjMode } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const ENDINGS: ConjEnding[] = ['é', 'er', 'ait', 'aient']
const BTN_COLORS = ['color-1', 'color-2', 'color-3', 'color-4']

type BlankState = 'idle' | 'ok' | 'err'

export default function ConjGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  // Refs for stale-closure safety inside setTimeout
  const conjProgressRef = useRef(state.conjProgress)
  const modeRef = useRef<ConjMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { conjProgressRef.current = state.conjProgress }, [state.conjProgress])

  // Local UI state
  const [mode, setMode] = useState<ConjMode>('all')
  const [sentIdx, setSentIdx] = useState(() => pickSentence(state.conjProgress, 'all'))
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [blank, setBlank] = useState<{ text: string; state: BlankState }>({ text: '___', state: 'idle' })
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tipOpen, setTipOpen] = useState(false)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function changeMode(m: ConjMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function loadNext(m?: ConjMode) {
    const idx = pickSentence(conjProgressRef.current, m ?? modeRef.current)
    setSentIdx(idx)
    setBlank({ text: '___', state: 'idle' })
    setFeedback(null)
    setAnswering(false)
  }

  function handleAnswer(val: ConjEnding) {
    if (answering) return
    setAnswering(true)

    const sentence = SENTENCES[sentIdx]
    const correct = val === sentence.ans
    const oldW = conjProgressRef.current[sentIdx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    dispatch({ type: 'UPDATE_CONJ', idx: sentIdx, weight: newW })
    conjProgressRef.current = { ...conjProgressRef.current, [sentIdx]: newW }

    if (correct) {
      streakRef.current++
      setStreak(streakRef.current)
      setSessionOk(n => n + 1)
      dispatch({ type: 'ADD_XP', amount: xpForCorrect(streakRef.current) })
    } else {
      streakRef.current = 0
      setStreak(0)
      setSessionErr(n => n + 1)
    }

    setBlank({ text: val, state: correct ? 'ok' : 'err' })

    // For wrong: flip blank to correct answer after 900ms
    if (!correct) {
      setTimeout(() => setBlank({ text: sentence.ans, state: 'ok' }), 900)
    }

    if (correct) {
      if (streakRef.current % 5 === 0) {
        playStreak()
        setFeedback({ msg: `🎉 ${streakRef.current} de suite !`, ok: true })
      } else {
        playCorrect()
        setFeedback({ msg: CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)], ok: true })
      }
    } else {
      playWrong()
      setFeedback({ msg: `C'était : « ${sentence.b}${sentence.ans}${sentence.a} »`, ok: false })
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 800 : 2200)
  }

  const sentence = SENTENCES[sentIdx]
  const { mastered, total, pct } = conjMasteryStats(conjProgressRef.current)

  return (
    <>
      {levelUp && <LevelUpOverlay level={levelUp} onDone={clearLevelUp} />}
      <div className="game-topbar">
        <button className="topbar-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'conj-progress' })}>
          📊 Progrès
        </button>
        <span className="profile-name">👤 {state.profile}</span>
        <button className="topbar-btn" onClick={() => { save(); dispatch({ type: 'NAVIGATE', screen: 'subject' }) }}>
          ← Sujets
        </button>
      </div>

      <div className="card">
        {/* Mode chips */}
        <div className="mode-row">
          {(['all', ...ENDINGS] as ConjMode[]).map(m => (
            <button
              key={m}
              className={`mode-chip${mode === m ? ' active' : ''}`}
              onClick={() => changeMode(m)}
            >
              {m === 'all' ? 'Tout' : `…${m}`}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-value">{streak >= 5 ? `${streak}🔥` : streak}</div>
            <div className="stat-label">🔥 Série</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{sessionOk}</div>
            <div className="stat-label">✅ Bons</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{sessionErr}</div>
            <div className="stat-label">❌ Ratés</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{pct}%</div>
            <div className="stat-label">⭐ Maîtrise</div>
          </div>
        </div>

        {/* Sentence */}
        <div className="sentence-wrap">
          <span>{sentence.b}</span>
          <span className={`sent-blank${blank.state !== 'idle' ? ` ${blank.state}` : ''}`}>
            {blank.text}
          </span>
          <span>{sentence.a}</span>
        </div>

        {/* Tip */}
        <div className="tip-row">
          <button className="tip-toggle" onClick={() => setTipOpen(o => !o)}>
            💡 {tipOpen ? "Fermer l'astuce" : 'Astuce'}
          </button>
        </div>
        {tipOpen && (
          <div className="tip-panel">
            <p>Remplace le verbe par « vendre » — quelle forme va ?</p>
            {[
              ['…é',     'Il a', 'vendu',    'Il a mang', 'é'],
              ['…er',    'Il veut', 'vendre', 'Il veut mang', 'er'],
              ['…ait',   'Il', 'vendait',    'Il mang', 'ait  (il / elle / on)'],
              ['…aient', 'Ils', 'vendaient', 'Ils mang', 'aient  (ils / elles)'],
            ].map(([ending, subj, vendre, ex, suffix]) => (
              <div key={ending} className="tip-entry">
                <span className="tip-ending">{ending}</span>
                <span className="tip-ex">
                  {subj} <strong>{vendre}</strong> → {ex}<strong>{suffix}</strong>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Answer buttons */}
        <div className="answer-grid">
          {ENDINGS.map((e, i) => (
            <button
              key={e}
              className={`ans-btn ${BTN_COLORS[i]}`}
              disabled={answering}
              onClick={() => handleAnswer(e)}
            >
              …{e}
            </button>
          ))}
        </div>

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
        </div>

        {/* Mastery bar */}
        <div className="mastery-bar-wrap">
          <div className="mastery-bar-label">
            <span>Maîtrise globale</span>
            <span>{mastered} / {total}</span>
          </div>
          <div className="mastery-bar">
            <div className="mastery-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </>
  )
}
