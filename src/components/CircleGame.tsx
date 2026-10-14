import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { pickCircleSkill, circleMasteryStats, applyCorrect, applyWrong } from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import CircleFigure from './CircleFigure'
import { CIRCLE_SKILLS, CIRCLE_SKILL_LABELS, makeCircleQuestion } from '../data/circleGame'
import type { CircleMode } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const MODES: CircleMode[] = ['all', 'nommer', 'segments', 'calcul', 'vrai-faux']
const MODE_LABELS: Record<CircleMode, string> = {
  all: 'Tout', nommer: 'Nommer', segments: 'Segments', calcul: 'Mesures', 'vrai-faux': 'Vrai/Faux',
}

export default function CircleGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  const progressRef = useRef(state.circleProgress)
  const modeRef = useRef<CircleMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.circleProgress }, [state.circleProgress])

  const [mode, setMode] = useState<CircleMode>('all')
  const [question, setQuestion] = useState(() =>
    makeCircleQuestion(pickCircleSkill(state.circleProgress, 'all')),
  )
  const [picked, setPicked] = useState<{ value: string; ok: boolean } | null>(null)
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean; explain?: string } | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function loadNext(m?: CircleMode) {
    setQuestion(makeCircleQuestion(pickCircleSkill(progressRef.current, m ?? modeRef.current)))
    setPicked(null)
    setFeedback(null)
  }

  function changeMode(m: CircleMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function answer(value: string) {
    if (picked) return
    const correct = value === question.answer
    setPicked({ value, ok: correct })

    const idx = CIRCLE_SKILLS.indexOf(question.skill)
    const oldW = progressRef.current[idx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)
    dispatch({ type: 'UPDATE_CIRCLE', idx, weight: newW })
    progressRef.current = { ...progressRef.current, [idx]: newW }

    if (correct) {
      streakRef.current++
      setStreak(streakRef.current)
      setSessionOk(n => n + 1)
      dispatch({ type: 'ADD_XP', amount: xpForCorrect(streakRef.current) })
      if (streakRef.current % 5 === 0) {
        playStreak()
        setFeedback({ msg: `🎉 ${streakRef.current} de suite !`, ok: true, explain: question.explain })
      } else {
        playCorrect()
        setFeedback({
          msg: CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)],
          ok: true,
          explain: question.explain,
        })
      }
    } else {
      streakRef.current = 0
      setStreak(0)
      setSessionErr(n => n + 1)
      playWrong()
      setFeedback({ msg: `C’était : ${question.answer}`, ok: false, explain: question.explain })
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 1600 : 3600)
  }

  const { mastered, total, pct } = circleMasteryStats(progressRef.current)
  const revealed = !!picked
  // Une fois répondu, la figure montre l'élément dont on parlait
  const shown = revealed && question.skill === 'segments'
    ? ({ '[AB]': 'diametre', '[OC]': 'rayon', 'le point O': 'centre', 'l’arc CB': 'arc' } as const)[
        question.answer as '[AB]' | '[OC]' | 'le point O' | 'l’arc CB'
      ] ?? null
    : question.highlight

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

        <CircleFigure highlight={shown} labels={question.labels} />

        <p className="grid-prompt">{question.prompt}</p>

        <div className={`answer-grid${question.choices.length === 2 ? ' stack' : ''}`}>
          {question.choices.map((c, i) => (
            <button
              key={c}
              className={`ans-btn word-btn color-${i + 1}${
                revealed && c === question.answer ? ' reveal' : ''
              }${revealed && picked && !picked.ok && c === picked.value ? ' wrong' : ''}`}
              disabled={revealed}
              onClick={() => answer(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
          {feedback?.explain && <div className="feedback-explain">{feedback.explain}</div>}
        </div>

        <div className="mastery-bar-wrap">
          <div className="mastery-bar-label">
            <span>{CIRCLE_SKILL_LABELS[question.skill]}</span>
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
