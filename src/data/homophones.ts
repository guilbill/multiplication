import type { HomophoneSentence } from '../types'

// ── on / ont ──────────────────────────────────────────────────
// « on »  → pronom sujet : on peut le remplacer par « il » ou « elle ».
// « ont » → verbe avoir (3ᵉ pers. pluriel) : on peut le mettre à
//           l'imparfait « avaient ».
//
// Dans chaque phrase, le blanc est la SEULE occurrence de on / ont
// pour que l'astuce du remplacement reste claire.
export const HOMOPHONE_SENTENCES: HomophoneSentence[] = [
  // ── on ────────────────────────────────────────────────
  { b: 'Demain, ',          a: ' va à la piscine.',            ans: 'on' },
  { b: 'Le dimanche, ',     a: ' joue dans le parc.',          ans: 'on' },
  { b: 'Quand il pleut, ',  a: ' reste à la maison.',          ans: 'on' },
  { b: 'Ce matin, ',        a: ' a préparé un gâteau.',        ans: 'on' },
  { b: 'À la récré, ',      a: ' joue au ballon.',             ans: 'on' },
  { b: 'En été, ',          a: ' mange beaucoup de glaces.',   ans: 'on' },
  { b: 'Plus tard, ',       a: ' ira en vacances à la mer.',   ans: 'on' },
  { b: 'Le soir, ',         a: ' regarde un film en famille.', ans: 'on' },
  { b: 'Aujourd\'hui, ',    a: ' chante une nouvelle chanson.',ans: 'on' },
  { b: 'Avec mon frère, ',  a: ' a construit une cabane.',     ans: 'on' },
  { b: 'En classe, ',       a: ' apprend à lire et à écrire.', ans: 'on' },
  { b: 'Quand ',            a: ' est gentil, on a des amis.',  ans: 'on' },

  // ── ont ───────────────────────────────────────────────
  { b: 'Les enfants ',      a: ' fini leurs devoirs.',         ans: 'ont' },
  { b: 'Mes amis ',         a: ' un nouveau jeu vidéo.',       ans: 'ont' },
  { b: 'Les chats ',        a: ' faim ce matin.',              ans: 'ont' },
  { b: 'Elles ',            a: ' gagné la course.',            ans: 'ont' },
  { b: 'Les voisins ',      a: ' planté des fleurs.',          ans: 'ont' },
  { b: 'Ces élèves ',       a: ' beaucoup travaillé.',         ans: 'ont' },
  { b: 'Les oiseaux ',      a: ' construit un nid.',           ans: 'ont' },
  { b: 'Mes parents ',      a: ' acheté une voiture rouge.',   ans: 'ont' },
  { b: 'Les joueurs ',      a: ' marqué un but.',              ans: 'ont' },
  { b: 'Tes copains ',      a: ' raté le bus de l\'école.',    ans: 'ont' },
  { b: 'Les filles ',       a: ' rangé toute la chambre.',     ans: 'ont' },
  { b: 'Les chiens ',       a: ' aboyé toute la nuit.',        ans: 'ont' },
]

// ── Replacement-trick text shown when the answer is revealed ──
export function homophoneReplacement(s: HomophoneSentence): string {
  // « on » → « il » ;  « ont » → « avaient » (imparfait)
  const word = s.ans === 'on' ? 'il' : 'avaient'
  return `${s.b}${word}${s.a}`
}
