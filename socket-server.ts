/**
 * Standalone Socket.io server for production.
 * Vercel serverless cannot run custom server.ts — deploy this on Railway, Fly.io, or a VPS.
 *
 * Env:
 *   PORT=3001
 *   DATABASE_URL=... (same as Next.js app)
 *   NEXT_PUBLIC_APP_URL=https://gulivechat.com (CORS)
 *   SOCKET_INTERNAL_SECRET=... (same as Vercel CRON_SECRET or dedicated secret)
 *
 * Vercel env:
 *   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.example.com
 *   SOCKET_SERVER_URL=https://your-socket-server.example.com (server-side bridge)
 *   SOCKET_INTERNAL_SECRET=...
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { initSocketServer, getIO } from './lib/socket'
import { applyRemoteSocketEmit, type RemoteSocketEmit } from './lib/socket-emit-core'

const port = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3001', 10)

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function authOk(req: IncomingMessage): boolean {
  const secret = process.env.SOCKET_INTERNAL_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false
    const fallback = process.env.CRON_SECRET?.trim()
    if (!fallback) return false
    return (req.headers.authorization || '') === `Bearer ${fallback}`
  }
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${secret}`
}

const server = createServer(async (req, res) => {
  if (req.url?.startsWith('/socket.io')) {
    return
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'gu-live-chat-socket',
        socketReady: !!getIO(),
        uptimeSec: Math.floor(process.uptime()),
      })
    )
    return
  }

  if (req.url === '/internal/emit' && req.method === 'POST') {
    if (!authOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw) as RemoteSocketEmit
      const io = getIO()
      if (!io) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: 'Socket not ready' }))
        return
      }
      applyRemoteSocketEmit(io, body)
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      console.error('[socket-server] internal/emit error:', err)
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Invalid payload' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found\n')
})

initSocketServer(server)

server.listen(port, () => {
  console.log(`> Gu Live Chat Socket.io on port ${port}`)
  console.log(`> Set NEXT_PUBLIC_SOCKET_URL on Vercel to point clients here`)
  console.log(`> Set SOCKET_SERVER_URL + SOCKET_INTERNAL_SECRET for Vercel → socket bridge`)
})
