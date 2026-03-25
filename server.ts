import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const PUBLIC_DIR = join(__dirname, 'public')
const PORT = Number(process.env.PORT ?? 3000)

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

/** Prevent path traversal — keep only safe chars */
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
}

function getBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

const HTML = readFileSync(join(PUBLIC_DIR, 'index.html'), 'utf8')

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url!, `http://localhost`)
  const { pathname } = url

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // GET /api/profiles
  if (pathname === '/api/profiles' && req.method === 'GET') {
    const profiles = existsSync(DATA_DIR)
      ? readdirSync(DATA_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => f.replace('.json', ''))
      : []
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(profiles))
    return
  }

  // GET|POST /api/progress?profile=name
  if (pathname === '/api/progress') {
    const raw = url.searchParams.get('profile') ?? ''
    const profile = sanitize(raw)
    if (!profile) {
      res.writeHead(400)
      res.end('Missing or invalid profile')
      return
    }

    const file = join(DATA_DIR, `${profile}.json`)

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(existsSync(file) ? readFileSync(file, 'utf8') : '{}')
      return
    }

    if (req.method === 'POST') {
      const body = await getBody(req)
      try {
        JSON.parse(body) // validate JSON
      } catch {
        res.writeHead(400)
        res.end('Invalid JSON')
        return
      }
      writeFileSync(file, body)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
      return
    }
  }

  // Serve SPA for everything else
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(HTML)
}).listen(PORT, () => {
  console.log(`\n🎮  Multiplication Master`)
  console.log(`    http://localhost:${PORT}\n`)
})
