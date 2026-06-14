import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { ADMIN_USER_DISPLAY_NAME } from '@/lib/site-config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { ensureAdminMarketingAccess } from '@/lib/marketing-website'
import { syncProductionSchema } from '@/lib/db-schema-sync'

// GET /api/cron/seed-admin
// Creates or updates the platform admin user from env vars.
// Requires CRON_SECRET + ADMIN_EMAIL + ADMIN_PASSWORD.
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    return NextResponse.json({ error: 'ADMIN_EMAIL and ADMIN_PASSWORD required' }, { status: 500 })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name: ADMIN_USER_DISPLAY_NAME, passwordHash, role: 'ADMIN' },
      update: { passwordHash, role: 'ADMIN', name: ADMIN_USER_DISPLAY_NAME },
    })
    const stored = await prisma.user.findUnique({
      where: { email },
      select: { email: true, role: true, passwordHash: true },
    })
    const passwordMatches = stored?.passwordHash
      ? await bcrypt.compare(password, stored.passwordHash)
      : false
    const schema = await syncProductionSchema()
    const marketingWebsiteId = await ensureAdminMarketingAccess(user.id)
    return NextResponse.json({
      message: 'Admin user ready',
      email: user.email,
      role: user.role,
      passwordMatches,
      hasPasswordHash: Boolean(stored?.passwordHash),
      databaseUrl: process.env.DATABASE_URL?.startsWith('libsql://') ? 'turso' : 'other',
      marketingWebsiteId,
      schema,
    })
  } catch (error) {
    console.error('[Cron] seed-admin error:', error)
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 })
  }
}
