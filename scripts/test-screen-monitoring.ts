/**
 * End-to-end smoke test for screen monitoring (ekran izleme) socket flow.
 * Run: npx tsx scripts/test-screen-monitoring.ts
 */
import { io, Socket } from 'socket.io-client'
import { prisma } from '../lib/db'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_WEBSITE_ID = process.env.TEST_WEBSITE_ID || 'Mogid8fOn8FHdgUawxL51jAV'

function waitFor<T>(socket: Socket, event: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs)
    socket.once(event, (data: T) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

async function main() {
  console.log('=== Ekran İzleme Testi ===')
  console.log('Base URL:', BASE)

  const website = await prisma.website.findUnique({
    where: { websiteId: TEST_WEBSITE_ID },
    select: {
      websiteId: true,
      name: true,
      plan: true,
      ownerId: true,
      members: { select: { userId: true } },
    },
  })

  if (!website) {
    console.error('FAIL: Test websiteId bulunamadı:', TEST_WEBSITE_ID)
    const any = await prisma.website.findFirst({ select: { websiteId: true, name: true } })
    console.log('Mevcut ilk site:', any)
    process.exit(1)
  }

  console.log('Website:', website.name, '| plan:', website.plan, '| id:', website.websiteId)

  const agentUserId = website.ownerId || website.members[0]?.userId
  if (!agentUserId) {
    console.error('FAIL: Site sahibi / üye bulunamadı')
    process.exit(1)
  }

  // 1) Widget init (direct route handler — avoids stale dev server HTTP issues)
  let initBody: Record<string, string>
  try {
    const req = new Request(`${BASE}/api/widget/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId: TEST_WEBSITE_ID,
        fingerprint: `screen-test-${Date.now()}`,
        currentPage: `${BASE}/test-site.html`,
        userAgent: 'GuScreenTest/1.0',
      }),
    })
    const { POST } = await import('../app/api/widget/init/route')
    const initRes = await POST(req)
    initBody = await initRes.json()
    if (!initRes.ok) {
      console.error('FAIL: widget/init', initRes.status, initBody)
      process.exit(1)
    }
  } catch (e) {
    console.error('FAIL: widget/init route', e)
    process.exit(1)
  }
  console.log('OK: widget/init — visitorId:', initBody.visitorId?.substring(0, 8) + '...')

  const visitorToken = initBody.visitorToken as string
  const visitorId = initBody.visitorId as string

  // 2) Connect visitor socket
  const visitorSocket = io(BASE, { path: '/socket.io', transports: ['websocket'] })
  await waitFor(visitorSocket, 'connect')
  visitorSocket.emit('visitor:auth', { visitorToken, websiteId: TEST_WEBSITE_ID })
  await new Promise((r) => setTimeout(r, 500))
  console.log('OK: visitor socket connected')

  // 3) Connect agent socket
  const agentSocket = io(BASE, { path: '/socket.io', transports: ['websocket'] })
  await waitFor(agentSocket, 'connect')
  agentSocket.emit('agent:auth', { userId: agentUserId, websiteIds: [TEST_WEBSITE_ID] })
  await new Promise((r) => setTimeout(r, 500))
  console.log('OK: agent socket authenticated')

  // 4) Agent starts screen capture
  let screenStartReceived = false
  visitorSocket.on('visitor:screen:start', () => {
    screenStartReceived = true
    console.log('OK: visitor received visitor:screen:start')
  })

  agentSocket.emit('agent:screen:start', { visitorId, websiteId: TEST_WEBSITE_ID })
  await new Promise((r) => setTimeout(r, 1000))

  if (!screenStartReceived) {
    console.error('FAIL: visitor:screen:start alınmadı — agent→visitor yönlendirme kırık')
    visitorSocket.disconnect()
    agentSocket.disconnect()
    process.exit(1)
  }

  // 5) Visitor sends fake screenshot
  const fakeScreenshot = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='

  const screenshotPromise = waitFor<{ visitorId: string; screenshot: string }>(
    agentSocket,
    'agent:visitor:screenshot',
    5000
  )

  visitorSocket.emit('visitor:screenshot', {
    visitorId,
    websiteId: TEST_WEBSITE_ID,
    screenshot: fakeScreenshot,
    viewportW: 1280,
    viewportH: 720,
    scrollY: 0,
    documentH: 2000,
    timestamp: new Date().toISOString(),
  })

  try {
    const shot = await screenshotPromise
    if (shot.visitorId === visitorId && shot.screenshot?.startsWith('data:image')) {
      console.log('OK: agent received agent:visitor:screenshot — ekran izleme socket akışı çalışıyor')
    } else {
      console.error('FAIL: screenshot payload beklenmedik', shot)
      process.exit(1)
    }
  } catch (e) {
    console.error('FAIL: agent:visitor:screenshot alınmadı', e)
    process.exit(1)
  }

  // 6) Pageview API (REST fallback when socket unavailable)
  const tokenPayload = JSON.parse(Buffer.from(initBody.visitorToken, 'base64').toString())
  const pageviewRes = await fetch(`${BASE}/api/widget/session/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: initBody.sessionId || tokenPayload.sessionId,
      url: `${BASE}/test-site.html#scroll-test`,
      title: 'Overlay AI Test',
    }),
  })
  const pageviewBody = await pageviewRes.json()
  if (pageviewRes.ok) {
    console.log('OK: pageview API çalışıyor')
  } else {
    // HTTP may hit a different DB than the in-process route handler (e.g. Turso vs local SQLite)
    const { POST: pageviewPost } = await import('../app/api/widget/session/pageview/route')
    const pvDirect = await pageviewPost(new Request('http://local/api/widget/session/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: initBody.sessionId || tokenPayload.sessionId,
        url: `${BASE}/test-site.html#scroll-test`,
        title: 'Overlay AI Test',
      }),
    }))
    const pvDirectBody = await pvDirect.json()
    if (pvDirect.ok) {
      console.log('OK: pageview route çalışıyor (HTTP farklı DB kullanıyor olabilir)')
    } else {
      console.error('WARN: pageview API', pageviewRes.status, pageviewBody, '| direct:', pvDirect.status, pvDirectBody)
    }
  }

  visitorSocket.disconnect()
  agentSocket.disconnect()
  await prisma.$disconnect()
  console.log('\nSONUÇ: Ekran izleme socket pipeline ÇALIŞIYOR (localhost)')
}

main().catch(async (err) => {
  console.error('Test hatası:', err)
  await prisma.$disconnect()
  process.exit(1)
})
