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
export type VocabMode = 'tracer' | 'copier' | 'dictee'

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

export interface VocabWord {
  article: string      // 'la ', 'un ', 'l’' or '' — already spaced
  word: string         // what the child has to write
  syllables: string[]  // written syllables, shown as a hint
}

/** One pen stroke, in canvas pixels: parallel x / y / timestamp arrays. */
export interface Stroke {
  x: number[]
  y: number[]
  t: number[]
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
