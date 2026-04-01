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
  { b: 'Je ',            a: ' mes clés.',                       verb: 'trouver', tense: 'présent', ans: 'trouve' },
  { b: 'Tu ',            a: ' toujours la bonne réponse.',      verb: 'trouver', tense: 'présent', ans: 'trouves' },
  { b: 'Il ',            a: ' un trésor dans le jardin.',       verb: 'trouver', tense: 'présent', ans: 'trouve' },
  { b: 'Nous ',          a: ' le chemin facilement.',           verb: 'trouver', tense: 'présent', ans: 'trouvons' },
  { b: 'Vous ',          a: ' la solution.',                    verb: 'trouver', tense: 'présent', ans: 'trouvez' },
  { b: 'Ils ',           a: ' des champignons dans la forêt.', verb: 'trouver', tense: 'présent', ans: 'trouvent' },

  // ── trouver — imparfait ────────────────────────────────
  { b: 'Je ',            a: ' toujours des excuses.',           verb: 'trouver', tense: 'imparfait', ans: 'trouvais' },
  { b: 'Tu ',            a: ' le temps long.',                  verb: 'trouver', tense: 'imparfait', ans: 'trouvais' },
  { b: 'Elle ',          a: ' ça très drôle.',                  verb: 'trouver', tense: 'imparfait', ans: 'trouvait' },
  { b: 'Nous ',          a: ' des coquillages sur la plage.',   verb: 'trouver', tense: 'imparfait', ans: 'trouvions' },
  { b: 'Vous ',          a: ' le film ennuyeux.',               verb: 'trouver', tense: 'imparfait', ans: 'trouviez' },
  { b: 'Ils ',           a: ' des fleurs dans le jardin.',      verb: 'trouver', tense: 'imparfait', ans: 'trouvaient' },

  // ── nager — présent ────────────────────────────────────
  { b: 'Je ',            a: ' dans la piscine.',                verb: 'nager', tense: 'présent', ans: 'nage' },
  { b: 'Tu ',            a: ' très bien.',                      verb: 'nager', tense: 'présent', ans: 'nages' },
  { b: 'Il ',            a: ' comme un poisson.',               verb: 'nager', tense: 'présent', ans: 'nage' },
  { b: 'Nous ',          a: ' dans le lac.',                    verb: 'nager', tense: 'présent', ans: 'nageons' },
  { b: 'Vous ',          a: ' tous les matins.',                verb: 'nager', tense: 'présent', ans: 'nagez' },
  { b: 'Elles ',         a: ' dans la mer.',                    verb: 'nager', tense: 'présent', ans: 'nagent' },

  // ── nager — imparfait ──────────────────────────────────
  { b: 'Je ',            a: ' chaque été.',                     verb: 'nager', tense: 'imparfait', ans: 'nageais' },
  { b: 'Tu ',            a: ' dans la rivière.',                verb: 'nager', tense: 'imparfait', ans: 'nageais' },
  { b: 'Elle ',          a: ' très vite.',                      verb: 'nager', tense: 'imparfait', ans: 'nageait' },
  { b: 'Nous ',          a: ' ensemble après l\'école.',        verb: 'nager', tense: 'imparfait', ans: 'nagions' },
  { b: 'Vous ',          a: ' dans le lac chaque été.',         verb: 'nager', tense: 'imparfait', ans: 'nagiez' },
  { b: 'Ils ',           a: ' tous les jours.',                 verb: 'nager', tense: 'imparfait', ans: 'nageaient' },

  // ── commencer — présent ────────────────────────────────
  { b: 'Je ',            a: ' mes devoirs.',                    verb: 'commencer', tense: 'présent', ans: 'commence' },
  { b: 'Tu ',            a: ' à comprendre.',                   verb: 'commencer', tense: 'présent', ans: 'commences' },
  { b: 'Il ',            a: ' à pleuvoir.',                     verb: 'commencer', tense: 'présent', ans: 'commence' },
  { b: 'Nous ',          a: ' le cours.',                       verb: 'commencer', tense: 'présent', ans: 'commençons' },
  { b: 'Vous ',          a: ' à manger.',                       verb: 'commencer', tense: 'présent', ans: 'commencez' },
  { b: 'Elles ',         a: ' à chanter.',                      verb: 'commencer', tense: 'présent', ans: 'commencent' },

  // ── commencer — imparfait ──────────────────────────────
  { b: "Je ",            a: " à m'ennuyer.",                    verb: 'commencer', tense: 'imparfait', ans: 'commençais' },
  { b: 'Tu ',            a: ' à grandir.',                      verb: 'commencer', tense: 'imparfait', ans: 'commençais' },
  { b: 'Il ',            a: ' à faire nuit.',                   verb: 'commencer', tense: 'imparfait', ans: 'commençait' },
  { b: 'Nous ',          a: ' à manger.',                       verb: 'commencer', tense: 'imparfait', ans: 'commencions' },
  { b: 'Vous ',          a: ' à comprendre.',                   verb: 'commencer', tense: 'imparfait', ans: 'commenciez' },
  { b: 'Ils ',           a: ' à jouer dehors.',                 verb: 'commencer', tense: 'imparfait', ans: 'commençaient' },
]
