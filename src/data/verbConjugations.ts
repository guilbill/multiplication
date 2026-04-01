import type { VerbTense, VerbConjSentence } from '../types'

// ── Conjugation tables ────────────────────────────────────────
export const VERB_TABLES: Record<string, Record<VerbTense, Record<string, string>>> = {
  trouver: {
    'présent': {
      'je': 'trouve', 'tu': 'trouves', 'il/elle/on': 'trouve',
      'nous': 'trouvons', 'vous': 'trouvez', 'ils/elles': 'trouvent',
    },
    'imparfait': {
      'je': 'trouvais', 'tu': 'trouvais', 'il/elle/on': 'trouvait',
      'nous': 'trouvions', 'vous': 'trouviez', 'ils/elles': 'trouvaient',
    },
  },
  nager: {
    'présent': {
      'je': 'nage', 'tu': 'nages', 'il/elle/on': 'nage',
      'nous': 'nageons', 'vous': 'nagez', 'ils/elles': 'nagent',
    },
    'imparfait': {
      'je': 'nageais', 'tu': 'nageais', 'il/elle/on': 'nageait',
      'nous': 'nagions', 'vous': 'nagiez', 'ils/elles': 'nageaient',
    },
  },
  commencer: {
    'présent': {
      'je': 'commence', 'tu': 'commences', 'il/elle/on': 'commence',
      'nous': 'commençons', 'vous': 'commencez', 'ils/elles': 'commencent',
    },
    'imparfait': {
      'je': 'commençais', 'tu': 'commençais', 'il/elle/on': 'commençait',
      'nous': 'commencions', 'vous': 'commenciez', 'ils/elles': 'commençaient',
    },
  },
}

// ── Helper: all conjugated forms of a verb ────────────────────
export function allForms(verb: string): string[] {
  const table = VERB_TABLES[verb]
  const forms = new Set<string>()
  for (const tense of Object.values(table)) {
    for (const form of Object.values(tense)) forms.add(form)
  }
  return [...forms]
}

// ── Generate 4 choices for a sentence ─────────────────────────
export function makeVerbChoices(verb: string, answer: string): string[] {
  const forms = allForms(verb).filter(f => f !== answer)
  // Shuffle and pick 3 distractors
  forms.sort(() => Math.random() - 0.5)
  return [answer, ...forms.slice(0, 3)].sort(() => Math.random() - 0.5)
}

// ── Sentences ─────────────────────────────────────────────────
export const VERB_SENTENCES: VerbConjSentence[] = [
  // ── trouver — présent ──────────────────────────────────
  { b: 'En ce moment, je ',       a: ' mes clés sous le canapé.',              verb: 'trouver', tense: 'présent', ans: 'trouve' },
  { b: 'Aujourd\'hui, tu ',       a: ' toujours la bonne réponse.',           verb: 'trouver', tense: 'présent', ans: 'trouves' },
  { b: 'En ce moment, il ',       a: ' un trésor dans le jardin.',            verb: 'trouver', tense: 'présent', ans: 'trouve' },
  { b: 'Maintenant, nous ',       a: ' le chemin facilement.',                verb: 'trouver', tense: 'présent', ans: 'trouvons' },
  { b: 'Aujourd\'hui, vous ',     a: ' la solution du problème.',             verb: 'trouver', tense: 'présent', ans: 'trouvez' },
  { b: 'En ce moment, ils ',      a: ' des champignons dans la forêt.',       verb: 'trouver', tense: 'présent', ans: 'trouvent' },

  // ── trouver — imparfait ────────────────────────────────
  { b: 'Quand j\'étais petit, je ',   a: ' toujours des excuses.',            verb: 'trouver', tense: 'imparfait', ans: 'trouvais' },
  { b: 'Avant, tu ',                  a: ' le temps long en classe.',         verb: 'trouver', tense: 'imparfait', ans: 'trouvais' },
  { b: 'Quand elle était jeune, elle ',a: ' ça très drôle.',                  verb: 'trouver', tense: 'imparfait', ans: 'trouvait' },
  { b: 'Chaque été, nous ',           a: ' des coquillages sur la plage.',    verb: 'trouver', tense: 'imparfait', ans: 'trouvions' },
  { b: 'À cette époque, vous ',       a: ' le film ennuyeux.',               verb: 'trouver', tense: 'imparfait', ans: 'trouviez' },
  { b: 'Autrefois, ils ',             a: ' des fleurs dans le jardin.',       verb: 'trouver', tense: 'imparfait', ans: 'trouvaient' },

  // ── nager — présent ────────────────────────────────────
  { b: 'En ce moment, je ',       a: ' dans la piscine.',                     verb: 'nager', tense: 'présent', ans: 'nage' },
  { b: 'Aujourd\'hui, tu ',       a: ' très bien.',                           verb: 'nager', tense: 'présent', ans: 'nages' },
  { b: 'Maintenant, il ',         a: ' comme un poisson.',                    verb: 'nager', tense: 'présent', ans: 'nage' },
  { b: 'Aujourd\'hui, nous ',     a: ' dans le lac.',                         verb: 'nager', tense: 'présent', ans: 'nageons' },
  { b: 'Ce matin, vous ',         a: ' dans la rivière.',                     verb: 'nager', tense: 'présent', ans: 'nagez' },
  { b: 'En ce moment, elles ',    a: ' dans la mer.',                         verb: 'nager', tense: 'présent', ans: 'nagent' },

  // ── nager — imparfait ──────────────────────────────────
  { b: 'Chaque été, je ',             a: ' dans le lac.',                     verb: 'nager', tense: 'imparfait', ans: 'nageais' },
  { b: 'Quand tu étais petit, tu ',   a: ' dans la rivière.',                verb: 'nager', tense: 'imparfait', ans: 'nageais' },
  { b: 'Avant, elle ',                a: ' très vite.',                       verb: 'nager', tense: 'imparfait', ans: 'nageait' },
  { b: 'Quand on était en vacances, nous ', a: ' ensemble.',                  verb: 'nager', tense: 'imparfait', ans: 'nagions' },
  { b: 'Autrefois, vous ',            a: ' dans le lac chaque été.',          verb: 'nager', tense: 'imparfait', ans: 'nagiez' },
  { b: 'Quand ils étaient jeunes, ils ', a: ' tous les jours.',              verb: 'nager', tense: 'imparfait', ans: 'nageaient' },

  // ── commencer — présent ────────────────────────────────
  { b: 'Maintenant, je ',         a: ' mes devoirs.',                         verb: 'commencer', tense: 'présent', ans: 'commence' },
  { b: 'Aujourd\'hui, tu ',       a: ' à comprendre la leçon.',              verb: 'commencer', tense: 'présent', ans: 'commences' },
  { b: 'En ce moment, il ',       a: ' à pleuvoir.',                         verb: 'commencer', tense: 'présent', ans: 'commence' },
  { b: 'Maintenant, nous ',       a: ' le cours de maths.',                  verb: 'commencer', tense: 'présent', ans: 'commençons' },
  { b: 'Aujourd\'hui, vous ',     a: ' à manger.',                           verb: 'commencer', tense: 'présent', ans: 'commencez' },
  { b: 'En ce moment, elles ',    a: ' à chanter.',                          verb: 'commencer', tense: 'présent', ans: 'commencent' },

  // ── commencer — imparfait ──────────────────────────────
  { b: "Chaque soir, je ",            a: " à m'ennuyer.",                    verb: 'commencer', tense: 'imparfait', ans: 'commençais' },
  { b: 'À cette époque, tu ',         a: ' à grandir vite.',                 verb: 'commencer', tense: 'imparfait', ans: 'commençais' },
  { b: 'Chaque hiver, il ',           a: ' à faire nuit très tôt.',          verb: 'commencer', tense: 'imparfait', ans: 'commençait' },
  { b: 'Autrefois, nous ',            a: ' à manger à midi.',               verb: 'commencer', tense: 'imparfait', ans: 'commencions' },
  { b: 'Avant, vous ',                a: ' à comprendre le français.',      verb: 'commencer', tense: 'imparfait', ans: 'commenciez' },
  { b: 'Quand ils étaient petits, ils ', a: ' à jouer dehors après le goûter.', verb: 'commencer', tense: 'imparfait', ans: 'commençaient' },
]
