/**
 * Standalone Socket.io server for production.
 * Vercel serverless cannot run custom server.ts — deploy this on Railway, Fly.io, or a VPS.
 *
 * Env:
 *   PORT=3001
 *   DATABASE_URL=... (same as Next.js app)
 *   NEXT_PUBLIC_APP_URL=https://guchat.org (CORS)
 *
 * Vercel env:
 *   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.example.com
 */
import { createServer } from 'http'
import { initSocketServer } from './lib/socket'

const port = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3001', 10)

const server = createServer((req, res) => {
  if (req.url?.startsWith('/socket.io')) {
    return
  }
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ status: 'ok', service: 'gu-live-chat-socket' }))
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found\n')
})

initSocketServer(server)

server.listen(port, () => {
  console.log(`> Gu Live Chat Socket.io on port ${port}`)
  console.log(`> Set NEXT_PUBLIC_SOCKET_URL on Vercel to point clients here`)
})
