import type { Stroke } from '../types'

/**
 * Envoie les tracés au serveur, qui interroge le moteur de reconnaissance
 * d'écriture manuscrite et renvoie les mots qu'il croit avoir lus, du plus
 * probable au moins probable. Lève une erreur si la reconnaissance est
 * indisponible (hors ligne, moteur injoignable) — l'appelant bascule alors
 * sur l'auto-correction.
 */
export async function recognize(
  strokes: Stroke[],
  width: number,
  height: number,
): Promise<string[]> {
  const ink = strokes.map(s => [s.x, s.y, s.t])
  const res = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ink, width, height }),
  })
  if (!res.ok) {
    // 404 → l'API n'est pas déployée · 502 → moteur injoignable
    throw new Error(`HTTP ${res.status}`)
  }
  const data = await res.json()
  if (!Array.isArray(data.candidates)) throw new Error('réponse inattendue')
  return data.candidates as string[]
}

/**
 * Comparaison « cahier » : on ignore la casse, les espaces et la forme de
 * l'apostrophe, mais PAS les accents — c'est justement ce qu'on apprend.
 */
export function sameWord(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.normalize('NFC').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, '')
  return norm(a) === norm(b)
}
