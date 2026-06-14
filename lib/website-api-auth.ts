import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

/** Tenant-scoped REST API: webhook secret or explicit site API token. */
export async function authorizeWebsiteApi(
  req: NextRequest,
  websitePublicId: string
): Promise<{ ok: true; websiteDbId: string } | { ok: false; response: NextResponse }> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'API token gerekli' }, { status: 401 }) }
  }

  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: { id: true },
  })
  if (!website) {
    return { ok: false, response: NextResponse.json({ error: 'Site bulunamadi' }, { status: 404 }) }
  }

  const hooks = await prisma.webhook.findMany({
    where: { websiteId: website.id, isActive: true },
    select: { secret: true },
  })
  for (const hook of hooks) {
    if (safeEqual(token, hook.secret)) {
      return { ok: true, websiteDbId: website.id }
    }
  }

  const siteToken = process.env[`SITE_API_TOKEN_${websitePublicId}`]?.trim()
  if (siteToken && safeEqual(token, siteToken)) {
    return { ok: true, websiteDbId: website.id }
  }

  return { ok: false, response: NextResponse.json({ error: 'Gecersiz API token' }, { status: 401 }) }
}
