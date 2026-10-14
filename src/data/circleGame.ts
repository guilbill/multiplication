import type { CirclePart, CircleQuestion, CircleSkill } from '../types'

// ── Le cercle : centre, rayon, diamètre, arc ──────────────────
// Figure de la leçon : cercle de centre O, diamètre [AB], rayon [OC],
// et l'arc de cercle entre C et B.
export const CIRCLE_SKILLS: CircleSkill[] = ['nommer', 'segments', 'calcul', 'vrai-faux']
export const CIRCLE_SKILL_LABELS: Record<CircleSkill, string> = {
  'nommer':    'Nommer',
  'segments':  'Segments',
  'calcul':    'Rayon & diamètre',
  'vrai-faux': 'Vrai ou faux',
}

const PART_NAMES: Record<CirclePart, string> = {
  centre:   'le centre',
  rayon:    'le rayon',
  diametre: 'le diamètre',
  arc:      'un arc de cercle',
}
const PART_EXPLAIN: Record<CirclePart, string> = {
  centre:   'Le centre O est le point du milieu, à égale distance de tout le cercle.',
  rayon:    'Le rayon va du centre jusqu’au cercle. Ici [OC].',
  diametre: 'Le diamètre traverse le cercle en passant par le centre. Ici [AB].',
  arc:      'Un arc de cercle est un morceau du cercle, entre deux points.',
}

const STATEMENTS: { text: string; ok: boolean; why: string }[] = [
  { text: 'Le rayon est la moitié du diamètre.', ok: true,
    why: 'Oui : le diamètre vaut deux rayons.' },
  { text: 'Le diamètre passe par le centre.', ok: true,
    why: 'Oui, c’est ce qui le distingue des autres segments.' },
  { text: 'Le diamètre est la moitié du rayon.', ok: false,
    why: 'Non, c’est l’inverse : le rayon est la moitié du diamètre.' },
  { text: 'Un arc de cercle est un morceau du cercle.', ok: true,
    why: 'Oui, la portion entre deux points du cercle.' },
  { text: 'Le centre est un point du cercle.', ok: false,
    why: 'Non : le centre est au milieu, il n’est pas sur le cercle.' },
  { text: 'Tous les rayons d’un cercle ont la même longueur.', ok: true,
    why: 'Oui, c’est la définition du cercle.' },
  { text: 'Le rayon va du centre jusqu’au cercle.', ok: true,
    why: 'Oui, comme le segment [OC] de la figure.' },
  { text: 'Un cercle de rayon 5 cm a un diamètre de 5 cm.', ok: false,
    why: 'Non : son diamètre mesure 10 cm.' },
]

const PARTS: CirclePart[] = ['centre', 'rayon', 'diametre', 'arc']

function rand(n: number) { return Math.floor(Math.random() * n) }
function pick<T>(arr: T[]): T { return arr[rand(arr.length)] }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function numberChoices(answer: number): string[] {
  const traps = new Set<number>()
  traps.add(answer * 2)
  traps.add(Math.round(answer / 2))
  traps.add(answer + 1)
  traps.add(answer - 1)
  traps.delete(answer)
  const others = [...traps].filter(n => n > 0).slice(0, 3)
  while (others.length < 3) {
    const n = answer + 1 + rand(6)
    if (n !== answer && !others.includes(n)) others.push(n)
  }
  return shuffle([answer, ...others]).map(n => `${n} cm`)
}

/** La compétence est choisie en amont (répétition espacée), pas ici. */
export function makeCircleQuestion(skill: CircleSkill): CircleQuestion {
  // ── Nommer ce qui est tracé en rouge ──
  if (skill === 'nommer') {
    const part = pick(PARTS)
    return {
      skill,
      prompt: 'Comment s’appelle ce qui est en rouge ?',
      highlight: part,
      labels: true,
      choices: shuffle(PARTS.map(p => PART_NAMES[p])),
      answer: PART_NAMES[part],
      explain: PART_EXPLAIN[part],
    }
  }

  // ── Reconnaître les segments nommés sur la figure ──
  if (skill === 'segments') {
    const named: Record<'rayon' | 'diametre' | 'centre', string> =
      { rayon: '[OC]', diametre: '[AB]', centre: 'le point O' }
    const part = pick(Object.keys(named) as ('rayon' | 'diametre' | 'centre')[])
    const answer = named[part]
    return {
      skill,
      prompt: `Sur la figure, où est ${PART_NAMES[part]} ?`,
      highlight: null,
      labels: true,
      choices: shuffle(['[AB]', '[OC]', 'le point O', 'l’arc CB']),
      answer,
      explain: PART_EXPLAIN[part],
    }
  }

  // ── Rayon ↔ diamètre ──
  if (skill === 'calcul') {
    const toDiameter = Math.random() < 0.5
    if (toDiameter) {
      const r = 2 + rand(9)
      return {
        skill,
        prompt: `Le rayon mesure ${r} cm. Combien mesure le diamètre ?`,
        highlight: 'rayon',
        labels: true,
        choices: numberChoices(r * 2),
        answer: `${r * 2} cm`,
        explain: `Le diamètre vaut deux rayons : ${r} + ${r} = ${r * 2} cm.`,
      }
    }
    const d = (2 + rand(9)) * 2
    return {
      skill,
      prompt: `Le diamètre mesure ${d} cm. Combien mesure le rayon ?`,
      highlight: 'diametre',
      labels: true,
      choices: numberChoices(d / 2),
      answer: `${d / 2} cm`,
      explain: `Le rayon est la moitié du diamètre : ${d} ÷ 2 = ${d / 2} cm.`,
    }
  }

  // ── Vrai ou faux ──
  const s = pick(STATEMENTS)
  return {
    skill,
    prompt: s.text,
    highlight: null,
    labels: true,
    choices: ['Vrai', 'Faux'],
    answer: s.ok ? 'Vrai' : 'Faux',
    explain: s.why,
  }
}
