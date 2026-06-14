import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Minimal public health probe — no internal topology details. */
export async function GET() {
  let ok = false
  try {
    await prisma.$queryRaw`SELECT 1`
    ok = true
  } catch {
    ok = false
  }

  return NextResponse.json({ ok }, { status: ok ? 200 : 503 })
}
