import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { pickGridSkill, gridMasteryStats, applyCorrect, applyWrong } from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import GridBoard from './GridBoard'
import {
  GRID_SKILLS, GRID_SKILL_LABELS, cellLabel, makeGridQuestion, revealMarks, sameCell,
} from '../data/gridGame'
import type { Cell, GridMode } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const MODES: GridMode[] = ['all', 'lire', 'placer', 'chemin', 'fleche']
const MODE_LABELS: Record<GridMode, string> = {
  all: 'Tout', lire: 'Lire', placer: 'Trouver', chemin: 'Chemin', fleche: 'Flèche',
}

export default function GridGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  const progressRef = useRef(state.gridProgress)
  const modeRef = useRef<GridMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.gridProgress }, [state.gridProgress])

  const [mode, setMode] = useState<GridMode>('all')
  const [question, setQuestion] = useState(() =>
    makeGridQuestion(pickGridSkill(state.gridProgress, 'all')),
  )
  const [picked, setPicked] = useState<{ cell?: Cell; value: string; ok: boolean } | null>(null)
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function loadNext(m?: GridMode) {
    setQuestion(makeGridQuestion(pickGridSkill(progressRef.current, m ?? modeRef.current)))
    setPicked(null)
    setFeedback(null)
  }

  function changeMode(m: GridMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function answer(value: string, cell?: Cell) {
    if (picked) return
    const correct = value === question.answer
    setPicked({ cell, value, ok: correct })

    const idx = GRID_SKILLS.indexOf(question.skill)
    const oldW = progressRef.current[idx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)
    dispatch({ type: 'UPDATE_GRID', idx, weight: newW })
    progressRef.current = { ...progressRef.current, [idx]: newW }

    if (correct) {
      streakRef.current++
      setStreak(streakRef.current)
      setSessionOk(n => n + 1)
      dispatch({ type: 'ADD_XP', amount: xpForCorrect(streakRef.current) })
      if (streakRef.current % 5 === 0) {
        playStreak()
        setFeedback({ msg: `🎉 ${streakRef.current} de suite !`, ok: true })
      } else {
        playCorrect()
        setFeedback({ msg: CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)], ok: true })
      }
    } else {
      streakRef.current = 0
      setStreak(0)
      setSessionErr(n => n + 1)
      playWrong()
      setFeedback({ msg: `C’était : ${question.answer}`, ok: false })
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 1100 : 3200)
  }

  const { mastered, total, pct } = gridMasteryStats(progressRef.current)
  const revealed = !!picked
  const marks = revealed ? revealMarks(question) : question.marks
  const tapCell = question.choices.length === 0

  return (
    <>
      {levelUp && <LevelUpOverlay level={levelUp} onDone={clearLevelUp} />}
      <div className="game-topbar">
        <span className="profile-name">👤 {state.profile}</span>
        <button className="topbar-btn" onClick={() => { save(); dispatch({ type: 'NAVIGATE', screen: 'subject' }) }}>
          ← Sujets
        </button>
      </div>

      <div className="card">
        <div className="mode-row">
          {MODES.map(m => (
            <button key={m} className={`mode-chip${mode === m ? ' active' : ''}`} onClick={() => changeMode(m)}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

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

        <p className="grid-prompt">{question.prompt}</p>

        {/* Le chemin à suivre */}
        {question.arrows.length > 0 && (
          <div className="arrow-strip">
            {question.arrows.map((a, i) => (
              <span
                key={i}
                className={`arrow-step${i === question.hiddenArrow ? ' hidden-arrow' : ''}${
                  i === question.hiddenArrow && revealed ? ' found' : ''
                }`}
              >
                {i === question.hiddenArrow && !revealed ? '?' : a}
              </span>
            ))}
          </div>
        )}

        <GridBoard
          marks={marks}
          path={question.path}
          picked={picked?.cell ?? null}
          target={question.target}
          revealed={revealed}
          onPick={tapCell ? (cell => answer(cellLabel(cell), cell)) : undefined}
        />

        {tapCell ? (
          <p className="grid-hint">
            {revealed && picked && !picked.ok && question.path.length > 0
              ? `Le chemin passe par ${question.path.map(cellLabel).join(' → ')}`
              : 'Touche la bonne case sur le quadrillage'}
          </p>
        ) : (
          <div className={`answer-grid${question.choices.length === 4 && question.skill === 'fleche' ? ' dirs' : ''}`}>
            {question.choices.map((c, i) => (
              <button
                key={c}
                className={`ans-btn color-${i + 1}${
                  revealed && c === question.answer ? ' reveal' : ''
                }${revealed && picked && !picked.ok && c === picked.value ? ' wrong' : ''}`}
                disabled={revealed}
                onClick={() => answer(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
        </div>

        <div className="mastery-bar-wrap">
          <div className="mastery-bar-label">
            <span>{GRID_SKILL_LABELS[question.skill]}</span>
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
