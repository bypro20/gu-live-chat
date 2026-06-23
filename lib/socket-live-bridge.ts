/** Vercel API → Railway socket sunucusundan canlı oturum listesi. */
export type RemoteLiveVisitor = {
  visitorId: string
  websiteId: string
  currentPage: string
  currentTitle: string
  cursorX: number
  cursorY: number
  viewportW: number
  viewportH: number
  scrollY: number
  documentH: number
  screenshotUrl: string | null
  screenshotAt: string | null
  connectedAt: string
  lastActiveAt: string
  isLive: true
}

function socketServerBase(): string | null {
  const raw =
    process.env.SOCKET_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (!raw) return null
  if (raw.includes('.vercel.app')) return null
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (appUrl && raw.replace(/\/$/, '') === appUrl) return null
  return raw.replace(/\/$/, '')
}

function internalSecret(): string | null {
  return (
    process.env.SOCKET_INTERNAL_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  )
}

/** Railway'deki gerçek socket oturumları (Vercel belleğinde yok). */
export async function fetchRemoteLiveVisitors(
  websiteId?: string
): Promise<RemoteLiveVisitor[]> {
  const base = socketServerBase()
  const secret = internalSecret()
  if (!base || !secret) return []

  const url = new URL(`${base}/internal/live-visitors`)
  if (websiteId) url.searchParams.set('websiteId', websiteId)

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { visitors?: RemoteLiveVisitor[] }
    return Array.isArray(data.visitors) ? data.visitors : []
  } catch (err) {
    console.error('[socket-live-bridge] fetch failed:', err)
    return []
  }
}

/** Production: Railway bridge; local dev: in-process socket belleği. */
export async function resolveLiveVisitors(websiteId?: string): Promise<RemoteLiveVisitor[]> {
  const remote = await fetchRemoteLiveVisitors(websiteId)
  if (socketServerBase() && internalSecret()) return remote
  const { getLiveVisitors, getAllLiveVisitors } = await import('./socket')
  const local = websiteId ? getLiveVisitors(websiteId) : getAllLiveVisitors()
  return local as RemoteLiveVisitor[]
}
