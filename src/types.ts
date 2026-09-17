export type Screen =
  | 'profile'
  | 'subject'
  | 'mult-game'
  | 'mult-progress'
  | 'conj-game'
  | 'conj-progress'
  | 'verb-conj-game'
  | 'homophone-game'
  | 'vocab-game'
  | 'boss-game'

export type ConjEnding = 'é' | 'er' | 'ait' | 'aient'
export type ConjMode = ConjEnding | 'all'
export type MultMode = 'all' | 'weak' | 'skip-easy' | number
export type VerbTense = 'présent' | 'imparfait'
export type VerbConjMode = VerbTense | 'all'
export type HomophoneAnswer = 'on' | 'ont'
export type HomophoneMode = HomophoneAnswer | 'all'
export type VocabRound = 'syllabes' | 'lettres' | 'orthographe'
export type VocabMode = VocabRound | 'all'

export interface Sentence {
  b: string       // text before the blank
  a: string       // text after the blank
  ans: ConjEnding
}

export interface VerbConjSentence {
  b: string       // text before the blank
  a: string       // text after the blank
  verb: string    // infinitive
  tense: VerbTense
  ans: string     // correct conjugated form
}

export interface HomophoneSentence {
  b: string       // text before the blank
  a: string       // text after the blank
  ans: HomophoneAnswer
}

export interface VocabHole {
  before: string    // start of the word, before the blank
  hidden: string    // the letters to find
  after: string     // rest of the word
  options: string[] // 4 candidates, the right one included
}

export interface VocabWord {
  article: string        // 'la ', 'un ', 'l’' or '' — already spaced
  word: string
  syllables: string[]    // written syllables, in order
  holes: VocabHole[]     // tricky spots for the « lettres » round
  misspellings: string[] // plausible wrong spellings, article included
}

export interface VocabQuestion {
  idx: number            // index in VOCAB_WORDS
  round: VocabRound
  display: string        // 'la maitresse'
  syllables: string[]    // ordered syllables
  shuffled: string[]     // shuffled syllables (« syllabes » round)
  hole?: VocabHole       // « lettres » round
  choices: string[]      // « lettres » / « orthographe » rounds
  answer: string
}

export interface MultPart {
  t: string
  blank?: boolean
}

export interface MultQuestion {
  k: string       // e.g. '3x7'
  parts: MultPart[]
  answer: number
  choices: number[]
}

export interface GameState {
  screen: Screen
  profile: string
  multProgress: Record<string, number>   // 'AxB' → weight
  conjProgress: Record<number, number>   // sentence index → weight
  verbConjProgress: Record<number, number> // verb-conj sentence index → weight
  homophoneProgress: Record<number, number> // on/ont sentence index → weight
  vocabProgress: Record<number, number>     // vocabulary word index → weight
  xp: number
}
