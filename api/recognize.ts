// Reconnaissance d'écriture manuscrite — version « fonction serverless »
// (Vercel & co). Le serveur Node local (server.ts) expose la même route ;
// les deux restent volontairement autonomes pour ne dépendre d'aucun bundler.

const HWR_URL = process.env.HWR_URL ??
  'https://inputtools.google.com/request?itc=fr-t-i0-handwrit&num=8&cp=0&cs=1&app=multiplication'

const MAX_STROKES = 200
const MAX_POINTS  = 4000

/** L'encre doit être [[[x…],[y…],[t…]], …], de tailles cohérentes et bornée. */
function isValidInk(ink: unknown): ink is number[][][] {
  if (!Array.isArray(ink) || !ink.length || ink.length > MAX_STROKES) return false
  let points = 0
  for (const stroke of ink) {
    if (!Array.isArray(stroke) || stroke.length !== 3) return false
    const [xs, ys, ts] = stroke
    if (![xs, ys, ts].every(a => Array.isArray(a) && a.every(n => typeof n === 'number'))) return false
    if (xs.length !== ys.length || xs.length !== ts.length) return false
    points += xs.length
    if (points > MAX_POINTS) return false
  }
  return true
}

export async function recognizeInk(
  ink: number[][][],
  width: number,
  height: number,
): Promise<string[]> {
  const upstream = await fetch(HWR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      options: 'enable_pre_space',
      requests: [{
        writing_guide: { writing_area_width: width, writing_area_height: height },
        ink,
        language: 'fr',
      }],
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!upstream.ok) throw new Error(`moteur HTTP ${upstream.status}`)
  const data = await upstream.json()
  // ["SUCCESS", [[id, [candidat, …], …]]]
  return Array.isArray(data) && data[0] === 'SUCCESS' ? data[1]?.[0]?.[1] ?? [] : []
}

interface Req { method?: string; body?: unknown }
interface Res {
  status: (code: number) => Res
  json: (body: unknown) => void
  end: (body?: string) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).end('Method Not Allowed'); return }

  // Vercel parse le JSON pour nous, mais pas toujours (content-type absent)
  let payload: any = req.body
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { res.status(400).end('Bad JSON'); return }
  }
  const { ink, width, height } = payload ?? {}
  if (!isValidInk(ink) || typeof width !== 'number' || typeof height !== 'number') {
    res.status(400).end('Bad ink')
    return
  }

  try {
    res.status(200).json({ candidates: await recognizeInk(ink, width, height) })
  } catch (err) {
    console.error('recognize failed:', (err as Error).message)
    res.status(502).json({ error: 'recognition unavailable' })
  }
}
