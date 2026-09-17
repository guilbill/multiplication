import type { VocabWord, VocabQuestion, VocabMode, VocabRound } from '../types'

// ── Mots à apprendre ──────────────────────────────────────────
// Les mots surlignés de la leçon « La combinaison des lettres ».
//
// Pour chaque mot :
//   article      → le petit mot devant (déjà espacé, vide si aucun)
//   syllables    → découpage écrit, à remettre dans l'ordre
//   holes        → les endroits « pièges » à compléter (accent, double
//                  consonne, son difficile…)
//   misspellings → orthographes fausses mais plausibles pour l'enfant
export const VOCAB_WORDS: VocabWord[] = [
  {
    article: 'la ',
    word: 'maitresse',
    syllables: ['mai', 'tres', 'se'],
    holes: [
      { before: 'm',      hidden: 'ai', after: 'tresse', options: ['ai', 'é', 'è', 'e'] },
      { before: 'maitre', hidden: 'ss', after: 'e',      options: ['ss', 's', 'c', 'ç'] },
    ],
    misspellings: ['la maitrèsse', 'la métresse', 'la maitrese'],
  },
  {
    article: 'l’',
    word: 'année',
    syllables: ['an', 'née'],
    holes: [
      { before: 'a',   hidden: 'nn', after: 'ée', options: ['nn', 'n', 'm', 'mm'] },
      { before: 'ann', hidden: 'ée', after: '',   options: ['ée', 'é', 'er', 'ez'] },
    ],
    misspellings: ['l’anée', 'l’anné', 'l’annè'],
  },
  {
    article: '',
    word: 'présenter',
    syllables: ['pré', 'sen', 'ter'],
    holes: [
      { before: 'pr',   hidden: 'é',  after: 'senter', options: ['é', 'è', 'e', 'ê'] },
      { before: 'prés', hidden: 'en', after: 'ter',    options: ['en', 'an', 'in', 'on'] },
    ],
    misspellings: ['presenter', 'prézenter', 'présentè'],
  },
  {
    article: 'un ',
    word: 'projet',
    syllables: ['pro', 'jet'],
    holes: [
      { before: 'pro',  hidden: 'j',  after: 'et', options: ['j', 'g', 'ge', 'dj'] },
      { before: 'proj', hidden: 'et', after: '',   options: ['et', 'er', 'é', 'ait'] },
    ],
    misspellings: ['un projé', 'un proget', 'un projais'],
  },
  {
    article: 'un ',
    word: 'élève',
    syllables: ['é', 'lè', 've'],
    holes: [
      { before: 'él', hidden: 'è', after: 've',   options: ['è', 'é', 'e', 'ê'] },
      { before: '',   hidden: 'é', after: 'lève', options: ['é', 'è', 'e', 'ê'] },
    ],
    misspellings: ['un éléve', 'un elève', 'un élèv'],
  },
]

export const VOCAB_ROUNDS: VocabRound[] = ['syllabes', 'lettres', 'orthographe']

/** Le mot complet, article compris — « la maitresse », « l'année ». */
export function fullWord(w: VocabWord): string {
  return w.article + w.word
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/** Mélange jusqu'à obtenir un ordre différent de l'original. */
function shuffleDifferent(arr: string[]): string[] {
  if (arr.length < 2) return [...arr]
  for (let i = 0; i < 12; i++) {
    const s = shuffle(arr)
    if (s.join('|') !== arr.join('|')) return s
  }
  return [...arr].reverse()
}

function pickRound(mode: VocabMode): VocabRound {
  return mode === 'all'
    ? VOCAB_ROUNDS[Math.floor(Math.random() * VOCAB_ROUNDS.length)]
    : mode
}

export function makeVocabQuestion(idx: number, mode: VocabMode): VocabQuestion {
  const w = VOCAB_WORDS[idx]
  const round = pickRound(mode)
  const display = fullWord(w)

  if (round === 'syllabes') {
    return {
      idx,
      round,
      display,
      syllables: w.syllables,
      shuffled: shuffleDifferent(w.syllables),
      choices: [],
      answer: w.syllables.join(''),
    }
  }

  if (round === 'lettres') {
    const hole = w.holes[Math.floor(Math.random() * w.holes.length)]
    return {
      idx,
      round,
      display,
      syllables: w.syllables,
      shuffled: [],
      hole,
      choices: shuffle(hole.options),
      answer: hole.hidden,
    }
  }

  return {
    idx,
    round,
    display,
    syllables: w.syllables,
    shuffled: [],
    choices: shuffle([display, ...w.misspellings]),
    answer: display,
  }
}
