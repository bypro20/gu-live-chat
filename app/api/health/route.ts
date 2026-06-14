import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Public health probe — minimal topology; admin panel db/socket göstergeleri için genişletilmiş alanlar. */
export async function GET() {
  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  const socketConfigured = Boolean(
    process.env.SOCKET_SERVER_URL?.trim() ||
      process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  )

  const ok = dbOk

  return NextResponse.json(
    {
      ok,
      db: dbOk,
      socket: socketConfigured,
    },
    { status: ok ? 200 : 503 }
  )
}
