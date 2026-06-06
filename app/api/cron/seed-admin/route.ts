import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// GET /api/cron/seed-admin
// Creates or updates the platform admin user from env vars.
// Requires CRON_SECRET + ADMIN_EMAIL + ADMIN_PASSWORD.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    return NextResponse.json({ error: 'ADMIN_EMAIL and ADMIN_PASSWORD required' }, { status: 500 })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name: 'Platform Admin', passwordHash, role: 'ADMIN' },
      update: { passwordHash, role: 'ADMIN' },
    })
    return NextResponse.json({ message: 'Admin user ready', email: user.email, role: user.role })
  } catch (error) {
    console.error('[Cron] seed-admin error:', error)
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 })
  }
}
