import type { Cell, Dir, GridMark, GridQuestion, GridSkill } from '../types'

// ── Le quadrillage de la leçon : lignes A…F, colonnes 1…6 ─────
export const ROWS = 6
export const COLS = 6
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

/** Les compétences suivies une par une par la répétition espacée. */
export const GRID_SKILLS: GridSkill[] = ['lire', 'placer', 'chemin', 'chemin-long', 'fleche']
export const GRID_SKILL_LABELS: Record<GridSkill, string> = {
  'lire':        'Lire une case',
  'placer':      'Trouver une case',
  'chemin':      'Chemin court',
  'chemin-long': 'Chemin long',
  'fleche':      'Flèche manquante',
}

const SHAPES = ['✖️', '⭕', '🟦', '⭐', '🔺']
const DIRS: Dir[] = ['←', '→', '↑', '↓']
const STEP: Record<Dir, Cell> = {
  '←': { r: 0, c: -1 },
  '→': { r: 0, c: 1 },
  '↑': { r: -1, c: 0 },
  '↓': { r: 1, c: 0 },
}

export function cellLabel(cell: Cell): string {
  return `${ROW_LABELS[cell.r]}${cell.c + 1}`
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c
}

function rand(n: number) { return Math.floor(Math.random() * n) }
function pick<T>(arr: T[]): T { return arr[rand(arr.length)] }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }
function randCell(): Cell { return { r: rand(ROWS), c: rand(COLS) } }

function inside(cell: Cell): boolean {
  return cell.r >= 0 && cell.r < ROWS && cell.c >= 0 && cell.c < COLS
}

function move(cell: Cell, dir: Dir): Cell {
  return { r: cell.r + STEP[dir].r, c: cell.c + STEP[dir].c }
}

/** Marche au hasard qui reste dans le quadrillage et ne fait pas demi-tour. */
function randomPath(start: Cell, length: number): { arrows: Dir[]; path: Cell[] } {
  const arrows: Dir[] = []
  const path: Cell[] = [start]
  let cur = start
  let guard = 0
  while (arrows.length < length && guard++ < 200) {
    const last = arrows[arrows.length - 1]
    const options = DIRS.filter(d => {
      if (!inside(move(cur, d))) return false
      // Pas d'aller-retour : le chemin resterait illisible
      if (last && STEP[d].r === -STEP[last].r && STEP[d].c === -STEP[last].c) return false
      return true
    })
    if (!options.length) break
    const dir = pick(options)
    arrows.push(dir)
    cur = move(cur, dir)
    path.push(cur)
  }
  return { arrows, path }
}

/** Les pièges classiques : ligne/colonne inversées, voisines. */
function cellChoices(target: Cell): string[] {
  const cands: Cell[] = []
  const swapped = { r: target.c, c: target.r }
  if (inside(swapped) && !sameCell(swapped, target)) cands.push(swapped)
  const near: Cell[] = [
    { r: target.r, c: target.c + 1 }, { r: target.r, c: target.c - 1 },
    { r: target.r + 1, c: target.c }, { r: target.r - 1, c: target.c },
  ].filter(inside)
  for (const c of shuffle(near)) {
    if (cands.length >= 3) break
    if (!cands.some(x => sameCell(x, c))) cands.push(c)
  }
  while (cands.length < 3) {
    const c = randCell()
    if (!sameCell(c, target) && !cands.some(x => sameCell(x, c))) cands.push(c)
  }
  return shuffle([target, ...cands.slice(0, 3)]).map(cellLabel)
}

/** La compétence est choisie en amont (répétition espacée), pas ici. */
export function makeGridQuestion(skill: GridSkill): GridQuestion {
  // ── Lire une case : la forme est posée, comment s'appelle sa case ? ──
  if (skill === 'lire') {
    const cell = randCell()
    const icon = pick(SHAPES)
    return {
      skill,
      prompt: `Dans quelle case est ${icon} ?`,
      marks: [{ cell, icon }],
      arrows: [],
      hiddenArrow: -1,
      path: [],
      target: cell,
      answer: cellLabel(cell),
      choices: cellChoices(cell),
    }
  }

  // ── Trouver une case : on donne le nom, l'enfant touche la case ──
  if (skill === 'placer') {
    const cell = randCell()
    return {
      skill,
      prompt: `Touche la case ${cellLabel(cell)}`,
      marks: [],
      arrows: [],
      hiddenArrow: -1,
      path: [],
      target: cell,
      answer: cellLabel(cell),
      choices: [],
    }
  }

  // ── Flèche manquante : départ et arrivée connus, un pas est caché ──
  if (skill === 'fleche') {
    const start = randCell()
    const { arrows, path } = randomPath(start, 2 + rand(2))
    const hidden = rand(arrows.length)
    const end = path[path.length - 1]
    return {
      skill,
      prompt: `De ${cellLabel(start)} à ${cellLabel(end)} : quelle flèche manque ?`,
      marks: [{ cell: start, icon: '🚩' }, { cell: end, icon: '🏁' }],
      start,
      arrows,
      hiddenArrow: hidden,
      path,
      target: end,
      answer: arrows[hidden],
      choices: [...DIRS],
    }
  }

  // ── Chemin : on part d'une case et on suit les flèches ──
  const length = skill === 'chemin' ? 2 + rand(2) : 4 + rand(3)
  const start = randCell()
  const { arrows, path } = randomPath(start, length)
  const end = path[path.length - 1]
  return {
    skill,
    prompt: `Départ en ${cellLabel(start)}. Suis les flèches : où arrives-tu ?`,
    marks: [{ cell: start, icon: '🚩' }],
    start,
    arrows,
    hiddenArrow: -1,
    path,
    target: end,
    answer: cellLabel(end),
    choices: [],
  }
}

/** Les marques visibles une fois la réponse donnée (arrivée comprise). */
export function revealMarks(q: GridQuestion): GridMark[] {
  if (q.skill === 'lire' || q.skill === 'placer') return q.marks
  return [...q.marks, { cell: q.target, icon: '🏁' }]
}
