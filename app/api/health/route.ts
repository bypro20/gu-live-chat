import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Public health probe — DB + app uptime. */
export async function GET() {
  const started = Date.now()
  let db = false
  try {
    await prisma.$queryRaw`SELECT 1`
    db = true
  } catch {
    db = false
  }

  const socketUrl = (
    process.env.SOCKET_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  let socket = false
  if (socketUrl && !socketUrl.includes('.vercel.app')) {
    try {
      const res = await fetch(`${socketUrl}/health`, {
        signal: AbortSignal.timeout(4000),
      })
      if (res.ok) {
        const data = (await res.json()) as { service?: string; status?: string }
        socket = data.service === 'gu-live-chat-socket' && data.status === 'ok'
      }
    } catch {
      socket = false
    }
  }

  const ok = db
  return NextResponse.json(
    {
      ok,
      db,
      redis: false,
      socket,
      socketConfigured: !!process.env.NEXT_PUBLIC_SOCKET_URL?.trim(),
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version || '1.0.0',
    },
    { status: ok ? 200 : 503 }
  )
}
