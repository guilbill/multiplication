export type Screen =
  | 'profile'
  | 'subject'
  | 'mult-game'
  | 'mult-progress'
  | 'conj-game'
  | 'conj-progress'
  | 'boss-game'

export type ConjEnding = 'é' | 'er' | 'ait' | 'aient'
export type ConjMode = ConjEnding | 'all'
export type MultMode = 'all' | 'weak' | 'skip-easy' | number

export interface Sentence {
  b: string       // text before the blank
  a: string       // text after the blank
  ans: ConjEnding
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
  xp: number
}
