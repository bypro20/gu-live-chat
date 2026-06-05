import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initSocketServer } from './lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Skip Socket.io paths — let Socket.io's own request handler deal with these.
    // Without this check, Next.js App Router would intercept /socket.io/* requests
    // and return a 404 or route handler response, breaking Socket.io polling.
    if (req.url?.startsWith('/socket.io')) {
      return
    }

    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.io — attaches its own request & upgrade listeners to the server.
  // Socket.io handles /socket.io/* paths for both HTTP polling and WebSocket upgrades.
  const io = initSocketServer(server)

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io server initialized on path /socket.io`)
  })
})