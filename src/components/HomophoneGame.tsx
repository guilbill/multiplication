import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  pickHomophoneSentence,
  homophoneMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import { HOMOPHONE_SENTENCES, homophoneReplacement } from '../data/homophones'
import type { HomophoneAnswer, HomophoneMode } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const CHOICES: HomophoneAnswer[] = ['on', 'ont']
const MODES: HomophoneMode[] = ['all', 'on', 'ont']
const MODE_LABELS: Record<HomophoneMode, string> = { all: 'Tout', on: 'on', ont: 'ont' }

const RULE_EXPLAIN: Record<HomophoneAnswer, string> = {
  on:  '« on » = il / elle. On peut le remplacer par « il ».',
  ont: '« ont » = verbe avoir. On peut le mettre à l’imparfait : « avaient ».',
}

type BlankState = 'idle' | 'ok' | 'err'

export default function HomophoneGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  // Refs for stale-closure safety inside setTimeout
  const progressRef = useRef(state.homophoneProgress)
  const modeRef = useRef<HomophoneMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.homophoneProgress }, [state.homophoneProgress])

  // Local UI state
  const [mode, setMode] = useState<HomophoneMode>('all')
  const [sentIdx, setSentIdx] = useState(() => pickHomophoneSentence(state.homophoneProgress, 'all'))
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [blank, setBlank] = useState<{ text: string; state: BlankState }>({ text: '___', state: 'idle' })
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean; explain?: string; replace?: string } | null>(null)
  const [tipOpen, setTipOpen] = useState(false)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function changeMode(m: HomophoneMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function loadNext(m?: HomophoneMode) {
    const idx = pickHomophoneSentence(progressRef.current, m ?? modeRef.current)
    setSentIdx(idx)
    setBlank({ text: '___', state: 'idle' })
    setFeedback(null)
    setAnswering(false)
  }

  function handleAnswer(val: HomophoneAnswer) {
    if (answering) return
    setAnswering(true)

    const sentence = HOMOPHONE_SENTENCES[sentIdx]
    const correct = val === sentence.ans
    const oldW = progressRef.current[sentIdx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    dispatch({ type: 'UPDATE_HOMOPHONE', idx: sentIdx, weight: newW })
    progressRef.current = { ...progressRef.current, [sentIdx]: newW }

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
      setFeedback({
        msg: `C'était : « ${sentence.b}${sentence.ans}${sentence.a} »`,
        ok: false,
        explain: RULE_EXPLAIN[sentence.ans],
        replace: `➡️ « ${homophoneReplacement(sentence)} »`,
      })
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 800 : 4500)
  }

  const sentence = HOMOPHONE_SENTENCES[sentIdx]
  const { mastered, total, pct } = homophoneMasteryStats(progressRef.current)

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
        {/* Mode chips */}
        <div className="mode-row">
          {MODES.map(m => (
            <button
              key={m}
              className={`mode-chip${mode === m ? ' active' : ''}`}
              onClick={() => changeMode(m)}
            >
              {MODE_LABELS[m]}
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
            <p>Remplace dans ta tête pour choisir :</p>
            <div className="tip-entry">
              <span className="tip-ending">on</span>
              <span className="tip-ex">
                Tu peux dire <strong>il</strong> ou <strong>elle</strong> → « On joue » → « <strong>Il</strong> joue »
              </span>
            </div>
            <div className="tip-entry">
              <span className="tip-ending">ont</span>
              <span className="tip-ex">
                Tu peux mettre à l'imparfait <strong>avaient</strong> → « Ils ont joué » → « Ils <strong>avaient</strong> joué »
              </span>
            </div>
          </div>
        )}

        {/* Answer buttons */}
        <div className="answer-grid">
          {CHOICES.map((c, i) => (
            <button
              key={c}
              className={`ans-btn color-${i + 1}`}
              disabled={answering}
              onClick={() => handleAnswer(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
          {feedback?.explain && (
            <div className="feedback-explain">
              {feedback.explain}
              {feedback.replace && <div>{feedback.replace}</div>}
            </div>
          )}
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
