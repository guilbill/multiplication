import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  pickVocabWord,
  vocabMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak, speakWord } from '../lib/audio'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import { VOCAB_WORDS, makeVocabQuestion, fullWord } from '../data/vocabulary'
import type { VocabMode, VocabRound } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const MODES: VocabMode[] = ['all', 'syllabes', 'lettres', 'orthographe']
const MODE_LABELS: Record<VocabMode, string> = {
  all: 'Tout',
  syllabes: 'Syllabes',
  lettres: 'Lettres',
  orthographe: 'Orthographe',
}

const INSTRUCTIONS: Record<VocabRound, string> = {
  syllabes:    'Remets les syllabes dans l’ordre',
  lettres:     'Choisis les lettres qui manquent',
  orthographe: 'Quelle est la bonne orthographe ?',
}

export default function VocabGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  // Refs for stale-closure safety inside setTimeout
  const progressRef = useRef(state.vocabProgress)
  const modeRef = useRef<VocabMode>('all')
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { progressRef.current = state.vocabProgress }, [state.vocabProgress])

  // Local UI state
  const [mode, setMode] = useState<VocabMode>('all')
  const [question, setQuestion] = useState(() =>
    makeVocabQuestion(pickVocabWord(state.vocabProgress), 'all'),
  )
  const [built, setBuilt] = useState<number[]>([])   // indices into question.shuffled
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [picked, setPicked] = useState<{ value: string; ok: boolean } | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean; explain?: string } | null>(null)
  const [revealed, setRevealed] = useState(false)   // wrong answer → show the right spelling
  const [tipOpen, setTipOpen] = useState(false)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (revealRef.current) clearTimeout(revealRef.current)
  }, [])

  function changeMode(m: VocabMode) {
    setMode(m)
    modeRef.current = m
    if (timerRef.current) clearTimeout(timerRef.current)
    if (revealRef.current) clearTimeout(revealRef.current)
    loadNext(m)
  }

  function loadNext(m?: VocabMode) {
    const idx = pickVocabWord(progressRef.current, question.idx)
    setQuestion(makeVocabQuestion(idx, m ?? modeRef.current))
    setBuilt([])
    setPicked(null)
    setFeedback(null)
    setRevealed(false)
    setAnswering(false)
  }

  /** Common scoring path for every round. */
  function score(correct: boolean, wrongMsg: string) {
    const oldW = progressRef.current[question.idx] ?? 1.0
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    dispatch({ type: 'UPDATE_VOCAB', idx: question.idx, weight: newW })
    progressRef.current = { ...progressRef.current, [question.idx]: newW }

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
      speakWord(question.display)
    } else {
      streakRef.current = 0
      setStreak(0)
      setSessionErr(n => n + 1)
      playWrong()
      setFeedback({
        msg: wrongMsg,
        ok: false,
        explain: `On écrit : ${question.syllables.join(' · ')}`,
      })
      // Leave the wrong answer on screen a moment, then show the right one
      revealRef.current = setTimeout(() => setRevealed(true), 900)
    }

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()

    timerRef.current = setTimeout(() => loadNext(), correct ? 900 : 4000)
  }

  // ── Round « syllabes » ──────────────────────────────────────
  function tapSyllable(i: number) {
    if (answering || built.includes(i)) return
    const next = [...built, i]
    setBuilt(next)
    if (next.length < question.shuffled.length) return

    setAnswering(true)
    const word = next.map(j => question.shuffled[j]).join('')
    score(word === question.answer, `C’était : « ${question.display} »`)
  }

  function undoSyllable() {
    if (answering) return
    setBuilt(b => b.slice(0, -1))
  }

  // ── Rounds « lettres » / « orthographe » ────────────────────
  function chooseAnswer(value: string) {
    if (answering) return
    setAnswering(true)
    const correct = value === question.answer
    setPicked({ value, ok: correct })
    score(correct, `C’était : « ${question.display} »`)
  }

  const { mastered, total, pct } = vocabMasteryStats(progressRef.current)
  const builtText = built.map(i => question.shuffled[i]).join('')
  // idle → ok (right answer, or the correction once revealed) → err
  const answerState = !feedback ? '' : feedback.ok || revealed ? ' ok' : ' err'

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

        {/* Instruction + écoute */}
        <div className="vocab-instruction">
          <span>{INSTRUCTIONS[question.round]}</span>
          <button className="speak-btn" onClick={() => speakWord(question.display)} title="Écouter le mot">
            🔊
          </button>
        </div>

        {/* ── Syllabes ── */}
        {question.round === 'syllabes' && (
          <>
            <div className="vocab-word">
              <span className="vocab-article">{VOCAB_WORDS[question.idx].article}</span>
              <span className={`vocab-build${answerState}`}>
                {revealed ? question.answer : builtText || '…'}
              </span>
            </div>
            <div className="syll-pool">
              {question.shuffled.map((syll, i) => (
                <button
                  key={i}
                  className={`syll-chip${built.includes(i) ? ' used' : ''}`}
                  disabled={answering || built.includes(i)}
                  onClick={() => tapSyllable(i)}
                >
                  {syll}
                </button>
              ))}
            </div>
            <div className="vocab-undo-row">
              <button
                className="vocab-undo"
                disabled={answering || !built.length}
                onClick={undoSyllable}
              >
                ↩ Effacer
              </button>
            </div>
          </>
        )}

        {/* ── Lettres ── */}
        {question.round === 'lettres' && question.hole && (
          <>
            <div className="vocab-word">
              <span className="vocab-article">{VOCAB_WORDS[question.idx].article}</span>
              <span>{question.hole.before}</span>
              <span className={`sent-blank${answerState}`}>
                {revealed ? question.answer : picked?.value ?? '__'}
              </span>
              <span>{question.hole.after}</span>
            </div>
            <div className="answer-grid">
              {question.choices.map((c, i) => (
                <button
                  key={c}
                  className={`ans-btn color-${i + 1}${
                    picked && c === question.answer ? ' reveal' : ''
                  }${picked && !picked.ok && c === picked.value ? ' wrong' : ''}`}
                  disabled={answering}
                  onClick={() => chooseAnswer(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Orthographe ── */}
        {question.round === 'orthographe' && (
          <div className="answer-grid stack">
            {question.choices.map((c, i) => (
              <button
                key={c}
                className={`ans-btn word-btn color-${i + 1}${
                  picked && c === question.answer ? ' reveal' : ''
                }${picked && !picked.ok && c === picked.value ? ' wrong' : ''}`}
                disabled={answering}
                onClick={() => chooseAnswer(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
          {feedback?.explain && <div className="feedback-explain">{feedback.explain}</div>}
        </div>

        {/* Tip — la liste des mots de la semaine */}
        <div className="tip-row">
          <button className="tip-toggle" onClick={() => setTipOpen(o => !o)}>
            💡 {tipOpen ? 'Fermer la liste' : 'Voir les mots'}
          </button>
        </div>
        {tipOpen && (
          <div className="tip-panel">
            <p>Les mots à apprendre :</p>
            {VOCAB_WORDS.map((w, i) => (
              <div className="tip-entry" key={i}>
                <span className="tip-word">{fullWord(w)}</span>
                <span className="tip-ex">{w.syllables.join(' · ')}</span>
                <button className="speak-btn small" onClick={() => speakWord(fullWord(w))} title="Écouter">
                  🔊
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mastery bar */}
        <div className="mastery-bar-wrap">
          <div className="mastery-bar-label">
            <span>Mots maîtrisés</span>
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
