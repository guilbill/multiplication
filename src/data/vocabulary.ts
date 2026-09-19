import type { VocabWord } from '../types'

// ── Mots à apprendre ──────────────────────────────────────────
// Les mots surlignés de la leçon « La combinaison des lettres ».
// L'enfant les écrit au stylet ; l'article n'est là que pour le contexte,
// seul `word` est à écrire. `syllables` sert d'aide et de correction.
export const VOCAB_WORDS: VocabWord[] = [
  { article: 'la ', word: 'maitresse', syllables: ['mai', 'tres', 'se'] },
  { article: 'l’',  word: 'année',     syllables: ['an', 'née'] },
  { article: '',    word: 'présenter', syllables: ['pré', 'sen', 'ter'] },
  { article: 'un ', word: 'projet',    syllables: ['pro', 'jet'] },
  { article: 'un ', word: 'élève',     syllables: ['é', 'lè', 've'] },
]

/** Le mot complet, article compris — « la maitresse », « l’année ». */
export function fullWord(w: VocabWord): string {
  return w.article + w.word
}
