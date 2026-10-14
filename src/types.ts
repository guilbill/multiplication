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
  | 'grid-game'
  | 'circle-game'
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
  gridProgress: Record<number, number>      // grid skill index → weight
  circleProgress: Record<number, number>    // circle skill index → weight
  xp: number
}

// ── Se repérer dans l'espace (quadrillage) ────────────────────
// Les cases se nomment « ligne puis colonne » : la ligne est une lettre
// (A…F), la colonne un chiffre (1…6) — B5 est ligne B, colonne 5.
export type GridSkill = 'lire' | 'placer' | 'chemin' | 'chemin-long' | 'fleche'
export type GridMode = 'all' | 'lire' | 'placer' | 'chemin' | 'fleche'
export type Dir = '←' | '→' | '↑' | '↓'

export interface Cell {
  r: number   // ligne, 0 = A
  c: number   // colonne, 0 = 1
}

export interface GridMark {
  cell: Cell
  icon: string
}

export interface GridQuestion {
  skill: GridSkill
  prompt: string
  marks: GridMark[]          // formes posées sur le quadrillage
  start?: Cell               // case de départ d'un chemin
  arrows: Dir[]              // le chemin à suivre
  hiddenArrow: number        // index de la flèche masquée, -1 sinon
  path: Cell[]               // cases traversées, pour la correction
  target: Cell               // la bonne case
  answer: string             // 'B5' ou '→'
  choices: string[]          // vide quand il faut toucher une case
}

// ── Le cercle ─────────────────────────────────────────────────
export type CircleSkill = 'nommer' | 'segments' | 'calcul' | 'vrai-faux'
export type CircleMode = 'all' | CircleSkill
export type CirclePart = 'centre' | 'rayon' | 'diametre' | 'arc'

export interface CircleQuestion {
  skill: CircleSkill
  prompt: string
  highlight: CirclePart | null   // ce qui est tracé en rouge sur la figure
  labels: boolean                // afficher O, A, B, C
  choices: string[]
  answer: string
  explain?: string
}
