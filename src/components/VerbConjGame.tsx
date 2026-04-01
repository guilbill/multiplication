import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  pickVerbSentence,
  verbConjMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import { VERB_SENTENCES, VERB_TABLES, makeVerbChoices } from '../data/verbConjugations'
import type { VerbConjMode, VerbTense } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const TENSE_MODES: VerbConjMode[] = ['all', 'présent', 'imparfait']
const TENSE_LABELS: Record<VerbConjMode, string> = { all: 'Tout', 'présent': 'Présent', 'imparfait': 'Imparfait' }

type BlankState = 'idle' | 'ok' | 'err'

function ConjTable({ verb, tense }: { verb: string; tense: VerbTense }) {
  const table = VERB_TABLES[verb]?.[tense]
  if (!table) return null
  const subjects = Object.keys(table)
  const left = subjects.slice(0, 3)
  const right = subjects.slice(3)
  return (
    <div className="conj-table-wrap">
      <div className="conj-table-title">{tense === 'présent' ? 'Présent' : 'Imparfait'} de « {verb} »</div>
      <div className="conj-table">
        <div className="conj-table-col">
          {left.map(s => (
            <div key={s} className="conj-table-row">
              <span className="conj-subj">{s}</span> <span className="conj-form">{table[s]}</span>
            </div>
          ))}
        </div>
        <div className="conj-table-col">
          {right.map(s => (
            <div key={s} className="conj-table-row">
              <span className="conj-subj">{s}</span> <span className="conj-form">{table[s]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function VerbConjGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  const progressRef = useRef(state.verbConjProgress)
  const modeRef = useRef<VerbConjMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.verbConjProgress }, [state.verbConjProgress])

  const [mode, setMode] = useState<VerbConjMode>('all')
  const [sentIdx, setSentIdx] = useState(() => pickVerbSentence(state.verbConjProgress, 'all'))
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [blank, setBlank] = useState<{ text: string; state: BlankState }>({ text: '___', state: 'idle' })
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean; verb?: string; tense?: VerbTense } | null>(null)
  const [choices, setChoices] = useState<string[]>(() => makeVerbChoices(VERB_SENTENCES[sentIdx].verb, VERB_SENTENCES[sentIdx].ans))

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function changeMode(m: VerbConjMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext(m)
  }

  function loadNext(m?: VerbConjMode) {
    const idx = pickVerbSentence(progressRef.current, m ?? modeRef.current)
    setSentIdx(idx)
    setChoices(makeVerbChoices(VERB_SENTENCES[idx].verb, VERB_SENTENCES[idx].ans))
    setBlank({ text: '___', state: 'idle' })
    setFeedback(null)
    setAnswering(false)
  }

  function handleAnswer(val: string) {
    if (answering) return
    setAnswering(true)

    const sentence = VERB_SENTENCES[sentIdx]
    const correct = val === sentence.ans
    const oldW = progressRef.current[sentIdx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    dispatch({ type: 'UPDATE_VERB_CONJ', idx: sentIdx, weight: newW })
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
        verb: sentence.verb,
        tense: sentence.tense,
      })
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 800 : 6000)
  }

  const sentence = VERB_SENTENCES[sentIdx]
  const { mastered, total, pct } = verbConjMasteryStats(progressRef.current)

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
        {/* Tense indicator */}
        <div className="verb-tense-badge">
          {sentence.tense === 'présent' ? '🔵 Présent' : '🟠 Imparfait'} — {sentence.verb}
        </div>

        {/* Mode chips */}
        <div className="mode-row">
          {TENSE_MODES.map(m => (
            <button
              key={m}
              className={`mode-chip${mode === m ? ' active' : ''}`}
              onClick={() => changeMode(m)}
            >
              {TENSE_LABELS[m]}
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

        {/* Answer buttons */}
        <div className="answer-grid">
          {choices.map((c, i) => (
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

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
          {feedback?.verb && feedback?.tense && (
            <ConjTable verb={feedback.verb} tense={feedback.tense} />
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
