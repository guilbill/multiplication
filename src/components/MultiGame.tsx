import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  generateMultQuestion,
  multMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import type { MultMode, MultQuestion } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const COLORS = ['color-1', 'color-2', 'color-3', 'color-4']
const MULT_MODES: { label: string; value: MultMode }[] = [
  { label: 'Tout', value: 'all' },
  { label: 'Sans faciles 💪', value: 'skip-easy' },
  { label: 'Difficiles 🎯', value: 'weak' },
  ...Array.from({ length: 10 }, (_, i) => ({ label: `× ${i + 1}`, value: i + 1 })),
]

type BtnState = 'idle' | 'reveal' | 'wrong'

export default function MultiGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  // Refs hold latest values for use inside setTimeout callbacks
  const progressRef = useRef(state.multProgress)
  const modeRef = useRef<MultMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.multProgress }, [state.multProgress])

  // Local UI state
  const [mode, setMode] = useState<MultMode>('all')
  const [question, setQuestion] = useState<MultQuestion>(() =>
    generateMultQuestion(state.multProgress, 'all'),
  )
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [btnStates, setBtnStates] = useState<Record<number, BtnState>>({})
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  // Clear pending timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function changeMode(m: MultMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function loadNext(m?: MultMode) {
    setQuestion(generateMultQuestion(progressRef.current, m ?? modeRef.current))
    setBtnStates({})
    setFeedback(null)
    setAnswering(false)
  }

  function handleAnswer(val: number) {
    if (answering) return
    setAnswering(true)

    const correct = val === question.answer
    const oldW = progressRef.current[question.k] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    // Update context and ref
    dispatch({ type: 'UPDATE_MULT', key: question.k, weight: newW })
    progressRef.current = { ...progressRef.current, [question.k]: newW }

    // Streak (use ref to avoid closure staleness)
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

    // Audio + feedback
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
      setFeedback({ msg: `La réponse était ${question.answer}`, ok: false })
    }

    setBtnStates(
      Object.fromEntries(
        question.choices.map(c => [
          c,
          c === question.answer ? 'reveal' : c === val && !correct ? 'wrong' : 'idle',
        ]),
      ),
    )

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 750 : 1600)
  }

  const { mastered, total, pct } = multMasteryStats(progressRef.current)

  return (
    <>
      {levelUp && <LevelUpOverlay level={levelUp} onDone={clearLevelUp} />}
      <div className="game-topbar">
        <button className="topbar-btn" onClick={() => { dispatch({ type: 'NAVIGATE', screen: 'mult-progress' }) }}>
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
          {MULT_MODES.map(({ label, value }) => (
            <button
              key={String(value)}
              className={`mode-chip${mode === value ? ' active' : ''}`}
              onClick={() => changeMode(value)}
            >
              {label}
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

        {/* Question */}
        <div className="question-wrap">
          <div className="question-eq">
            {question.parts.map((p, i) =>
              p.blank ? (
                <span key={i} className="q-blank">?</span>
              ) : (
                <span key={i}>{p.t}</span>
              ),
            )}
          </div>
        </div>

        {/* Answer buttons */}
        <div className="answer-grid">
          {question.choices.map((val, i) => {
            const s = btnStates[val] ?? 'idle'
            return (
              <button
                key={val}
                className={`ans-btn ${COLORS[i]}${s !== 'idle' ? ` ${s}` : ''}`}
                disabled={answering}
                onClick={() => handleAnswer(val)}
              >
                {val}
              </button>
            )
          })}
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
