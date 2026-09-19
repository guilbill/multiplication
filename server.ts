import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR   = join(__dirname, 'data')
const DIST_DIR   = join(__dirname, 'dist')
const IS_PROD    = existsSync(join(DIST_DIR, 'index.html'))
// Handwriting recognition backend. Google's input-tools endpoint needs no key
// and reads cursive French well; override with HWR_URL to use another engine.
const HWR_URL    = process.env.HWR_URL ??
  'https://inputtools.google.com/request?itc=fr-t-i0-handwrit&num=8&cp=0&cs=1&app=multiplication'
const PORT       = Number(process.env.PORT ?? (IS_PROD ? 3000 : 3001))

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
}

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
}

const MAX_STROKES = 200
const MAX_POINTS   = 4000

/** Ink must be [[[x…],[y…],[t…]], …] with matching lengths, and stay small. */
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

function getBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url!, `http://localhost`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // ── API: list profiles ────────────────────────────────────
  if (url.pathname === '/api/profiles' && req.method === 'GET') {
    const profiles = readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(profiles))
    return
  }

  // ── API: load / save progress ─────────────────────────────
  if (url.pathname === '/api/progress') {
    const profile = sanitize(url.searchParams.get('profile') ?? '')
    if (!profile) { res.writeHead(400); res.end('Bad profile'); return }

    const file = join(DATA_DIR, `${profile}.json`)

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(existsSync(file) ? readFileSync(file, 'utf8') : '{}')
      return
    }

    if (req.method === 'POST') {
      const body = await getBody(req)
      try { JSON.parse(body) } catch { res.writeHead(400); res.end('Bad JSON'); return }
      writeFileSync(file, body)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
      return
    }
  }

  // ── API: handwriting recognition ──────────────────────────
  // Body: { ink: [[[x…],[y…],[t…]], …], width, height }
  // Answers { candidates: string[] } — the words the engine thinks it read.
  if (url.pathname === '/api/recognize' && req.method === 'POST') {
    const body = await getBody(req)
    let ink: unknown, width: unknown, height: unknown
    try { ({ ink, width, height } = JSON.parse(body)) } catch {
      res.writeHead(400); res.end('Bad JSON'); return
    }
    if (!isValidInk(ink) || typeof width !== 'number' || typeof height !== 'number') {
      res.writeHead(400); res.end('Bad ink'); return
    }

    try {
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
      if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`)
      const data = await upstream.json()
      // ["SUCCESS", [[id, [candidate, …], …]]]
      const candidates: string[] =
        Array.isArray(data) && data[0] === 'SUCCESS' ? data[1]?.[0]?.[1] ?? [] : []
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ candidates }))
    } catch (err) {
      console.error('recognize failed:', (err as Error).message)
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'recognition unavailable' }))
    }
    return
  }

  // ── Static file serving (production only) ─────────────────
  if (!IS_PROD) {
    res.writeHead(404)
    res.end('Use the Vite dev server (npm run dev)')
    return
  }

  // Try to serve the exact file from dist/
  const filePath = join(DIST_DIR, url.pathname)
  if (
    url.pathname !== '/' &&
    existsSync(filePath) &&
    !filePath.includes('..')
  ) {
    const mime = MIME[extname(filePath)] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime })
    res.end(readFileSync(filePath))
    return
  }

  // SPA fallback — serve index.html for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(readFileSync(join(DIST_DIR, 'index.html'), 'utf8'))
}).listen(PORT, () => {
  console.log(`\n🎮  Multiplication Master`)
  if (IS_PROD) {
    console.log(`    http://localhost:${PORT}\n`)
  } else {
    console.log(`    API  → http://localhost:${PORT}`)
    console.log(`    App  → http://localhost:5173  (Vite)\n`)
  }
})
