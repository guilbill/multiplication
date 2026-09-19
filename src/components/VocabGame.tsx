import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import {
  pickVocabWord,
  vocabMasteryStats,
  applyCorrect,
  applyWrong,
} from '../lib/spacedRepetition'
import { playCorrect, playWrong, playStreak, speakWord } from '../lib/audio'
import { recognize, sameWord } from '../lib/handwriting'
import { xpForCorrect } from '../lib/xp'
import { useLevelUp } from '../hooks/useLevelUp'
import LevelUpOverlay from './LevelUpOverlay'
import WriteCanvas from './WriteCanvas'
import { VOCAB_WORDS, fullWord } from '../data/vocabulary'
import type { Stroke, VocabMode } from '../types'

const CORRECT_MSGS = ['Super !', 'Bravo !', 'Excellent !', 'Parfait !', 'Génial !', '👍 Bien !']
const MODES: VocabMode[] = ['tracer', 'copier', 'dictee']
const MODE_LABELS: Record<VocabMode, string> = {
  tracer: '✏️ Repasser',
  copier: '👀 Copier',
  dictee: '👂 Dictée',
}
const INSTRUCTIONS: Record<VocabMode, string> = {
  tracer: 'Repasse sur le modèle',
  copier: 'Regarde le mot, puis écris-le',
  dictee: 'Écoute le mot et écris-le',
}

// 'writing' → en train d'écrire · 'checking' → lecture en cours
// 'judged'  → corrigé · 'selfcheck' → le lecteur n'a pas répondu, l'enfant compare
type Phase = 'writing' | 'checking' | 'judged' | 'selfcheck'

const CANVAS_HEIGHT = 190

export default function VocabGame() {
  const { state, dispatch, save } = useGame()
  const [levelUp, clearLevelUp] = useLevelUp(state.xp)

  // Refs for stale-closure safety inside setTimeout
  const progressRef = useRef(state.vocabProgress)
  const streakRef = useRef(0)
  const answerCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasBoxRef = useRef<HTMLDivElement>(null)
  // Poids d'avant la correction — sert au rattrapage « j'avais bien écrit »
  const prevWeightRef = useRef(1.0)
  const prevStreakRef = useRef(0)

  useEffect(() => { progressRef.current = state.vocabProgress }, [state.vocabProgress])

  // Local UI state
  const [mode, setMode] = useState<VocabMode>('tracer')
  const [idx, setIdx] = useState(() => pickVocabWord(state.vocabProgress))
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [phase, setPhase] = useState<Phase>('writing')
  const [read, setRead] = useState<string | null>(null)   // ce que le lecteur a lu
  const [streak, setStreak] = useState(0)
  const [sessionOk, setSessionOk] = useState(0)
  const [sessionErr, setSessionErr] = useState(0)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [peek, setPeek] = useState(false)      // coup d'œil au modèle en dictée
  const [tipOpen, setTipOpen] = useState(false)

  const word = VOCAB_WORDS[idx]

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // En dictée, le mot est dit à chaque nouveau tirage
  useEffect(() => {
    if (mode === 'dictee' && phase === 'writing') speakWord(fullWord(word))
  }, [idx, mode, phase, word])

  function changeMode(m: VocabMode) {
    setMode(m)
    if (timerRef.current) clearTimeout(timerRef.current)
    loadNext()
  }

  function loadNext() {
    setIdx(pickVocabWord(progressRef.current, idx))
    setStrokes([])
    setPhase('writing')
    setRead(null)
    setFeedback(null)
    setPeek(false)
  }

  function clearInk() {
    if (phase !== 'writing') return
    setStrokes([])
    setPhase('writing')
    setRead(null)
    setFeedback(null)
  }

  function undoStroke() {
    if (phase !== 'writing') return
    setStrokes(s => s.slice(0, -1))
  }

  /** Enregistre le résultat : poids, série, XP, son. */
  function score(correct: boolean) {
    const oldW = progressRef.current[idx] ?? 1.0
    prevWeightRef.current = oldW
    prevStreakRef.current = streakRef.current
    const newW = correct ? applyCorrect(oldW) : applyWrong(oldW)

    dispatch({ type: 'UPDATE_VOCAB', idx, weight: newW })
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
      timerRef.current = setTimeout(() => loadNext(), 1800)
    } else {
      streakRef.current = 0
      setStreak(0)
      setSessionErr(n => n + 1)
      playWrong()
      setFeedback({ msg: `C’était : ${word.word} — ${word.syllables.join(' · ')}`, ok: false })
      // Pas d'enchaînement automatique : l'enfant compare son mot au modèle
    }
    setPhase('judged')

    answerCountRef.current++
    if (answerCountRef.current % 5 === 0) save()
  }

  /** Le lecteur s'est trompé, pas l'enfant : on repasse la réponse en juste. */
  function overrideCorrect() {
    const oldW = prevWeightRef.current
    const newW = applyCorrect(oldW)
    dispatch({ type: 'UPDATE_VOCAB', idx, weight: newW })
    progressRef.current = { ...progressRef.current, [idx]: newW }

    // La série reprend là où l'erreur de lecture l'avait coupée
    streakRef.current = prevStreakRef.current + 1
    setStreak(streakRef.current)
    setSessionErr(n => Math.max(0, n - 1))
    setSessionOk(n => n + 1)
    dispatch({ type: 'ADD_XP', amount: xpForCorrect(streakRef.current) })
    playCorrect()
    setFeedback({ msg: 'D’accord, c’était juste !', ok: true })
    timerRef.current = setTimeout(() => loadNext(), 1500)
  }

  async function check() {
    if (!strokes.length || phase === 'checking') return
    setPhase('checking')
    const box = canvasBoxRef.current
    try {
      const candidates = await recognize(
        strokes,
        box?.clientWidth ?? 400,
        CANVAS_HEIGHT,
      )
      const hit = candidates.find(c => sameWord(c, word.word))
      setRead(candidates[0] ?? '')
      score(Boolean(hit))
    } catch {
      // Moteur injoignable (hors ligne, panne) — l'enfant se corrige lui-même
      setPhase('selfcheck')
      setFeedback(null)
    }
  }

  const { mastered, total, pct } = vocabMasteryStats(progressRef.current)
  const showModel =
    mode === 'tracer' || mode === 'copier' || peek || phase === 'judged' || phase === 'selfcheck'
  const writing = phase === 'writing'

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

        {/* Consigne + écoute */}
        <div className="vocab-instruction">
          <span>{INSTRUCTIONS[mode]}</span>
          <button className="speak-btn" onClick={() => speakWord(fullWord(word))} title="Écouter le mot">
            🔊
          </button>
        </div>

        {/* Modèle */}
        <div className="vocab-model">
          <span className="vocab-article">{word.article}</span>
          <span className={`vocab-target${showModel ? '' : ' hidden'}`}>
            {showModel ? word.word : '• '.repeat(word.word.length).trim()}
          </span>
        </div>

        {/* Ardoise */}
        <div className="canvas-box" ref={canvasBoxRef}>
          <WriteCanvas
            strokes={strokes}
            onChange={setStrokes}
            disabled={phase !== 'writing'}
            ghost={mode === 'tracer' ? word.word : undefined}
            height={CANVAS_HEIGHT}
          />
          {read !== null && phase === 'judged' && (
            <div className="read-badge">J’ai lu : « {read || '…'} »</div>
          )}
        </div>

        {/* Outils */}
        <div className="write-tools">
          <button className="write-tool" disabled={!writing || !strokes.length} onClick={undoStroke}>↩</button>
          <button className="write-tool" disabled={!writing || !strokes.length} onClick={clearInk}>🗑</button>
          {mode === 'dictee' && writing && (
            <button className="write-tool" onClick={() => setPeek(p => !p)} title="Voir le modèle">👀</button>
          )}
          {writing && (
            <button className="btn-check" disabled={!strokes.length} onClick={check}>
              ✅ Vérifier
            </button>
          )}
          {phase === 'checking' && <button className="btn-check" disabled>⏳ Je lis…</button>}
          {phase === 'judged' && (
            <button className="btn-check" onClick={loadNext}>Mot suivant →</button>
          )}
        </div>

        {/* Auto-correction quand le lecteur n'a pas pu répondre */}
        {phase === 'selfcheck' && (
          <div className="selfcheck">
            <p>Je n’ai pas pu lire ton mot. Compare avec le modèle :</p>
            <div className="selfcheck-btns">
              <button className="selfcheck-btn ok" onClick={() => score(true)}>✅ C’est pareil</button>
              <button className="selfcheck-btn err" onClick={() => score(false)}>❌ Pas pareil</button>
            </div>
          </div>
        )}

        <div className={`feedback${feedback ? (feedback.ok ? ' ok' : ' err') : ''}`}>
          {feedback?.msg ?? ''}
        </div>

        {/* Rattrapage : le lecteur a mal lu une écriture correcte */}
        {phase === 'judged' && feedback && !feedback.ok && (
          <div className="tip-row">
            <button className="tip-toggle" onClick={overrideCorrect}>
              ✍️ J’avais bien écrit
            </button>
          </div>
        )}

        {/* Liste des mots */}
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
