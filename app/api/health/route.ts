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

  const ok = db
  return NextResponse.json(
    {
      ok,
      db,
      redis: false,
      socket: !!process.env.NEXT_PUBLIC_SOCKET_URL?.trim(),
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version || '1.0.0',
    },
    { status: ok ? 200 : 503 }
  )
}
