import type { RemoteSocketEmit } from './socket-emit-core'

/** Forward socket events from Vercel API routes to the standalone socket server. */
export async function bridgeSocketEmit(body: RemoteSocketEmit): Promise<void> {
  const raw =
    process.env.SOCKET_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  const secret =
    process.env.SOCKET_INTERNAL_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim()

  if (!raw || !secret) return
  // Vercel ana uygulama hostu socket sunucusu değil
  if (raw.includes('.vercel.app')) return
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (appUrl && raw.replace(/\/$/, '') === appUrl) return

  const base = raw

  const url = `${base.replace(/\/$/, '')}/internal/emit`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error('[socket-bridge] emit failed:', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('[socket-bridge] emit error:', err)
  }
}
