import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getSubscriptionStatus,
  cancelSubscription,
  initiateCheckout,
} from '@/lib/subscription'

/**
 * Resolve the target website for billing operations.
 *
 * Priority:
 *   1. Explicit `websiteId` param — verified that the user is OWNER or ADMIN
 *   2. `activeWebsiteId` stored in the JWT session
 *   3. First owned website (legacy fallback)
 */
async function resolveWebsite(
  userId: string,
  requestedWebsiteId?: string | null,
  sessionActiveId?: string | null
): Promise<{ websiteId: string; plan: string } | null> {
  const candidates = [requestedWebsiteId, sessionActiveId].filter(Boolean) as string[]

  for (const wid of candidates) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        website: { websiteId: wid },
      },
      select: { website: { select: { websiteId: true, plan: true } } },
    })
    if (membership?.website) return membership.website
  }

  // Fallback: first owned website
  const owned = await prisma.website.findFirst({
    where: { ownerId: userId },
    select: { websiteId: true, plan: true },
  })
  return owned ?? null
}

// GET — Get current subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const requestedId = request.nextUrl.searchParams.get('websiteId')
    const website = await resolveWebsite(user.id, requestedId, session.user.activeWebsiteId)
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const subscription = await getSubscriptionStatus(website.websiteId)
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('[Subscription API] GET error:', error)
    return NextResponse.json({ error: 'Abonelik durumu alınamadı' }, { status: 500 })
  }
}

// POST — Cancel subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    let requestedId: string | null = null
    try {
      const body = await request.json()
      requestedId = body?.websiteId ?? null
    } catch {
      // Body is optional — ignore parse errors
    }

    const website = await resolveWebsite(user.id, requestedId, session.user.activeWebsiteId)
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    if (website.plan === 'FREE') {
      return NextResponse.json({ error: 'Zaten ücretsiz plan aktif' }, { status: 400 })
    }

    await cancelSubscription(website.websiteId)

    return NextResponse.json({ success: true, message: 'Abonelik iptal edildi' })
  } catch (error) {
    console.error('[Subscription API] POST error:', error)
    return NextResponse.json({ error: 'Abonelik iptal edilemedi' }, { status: 500 })
  }
}

// PATCH — Upgrade/downgrade plan (initiates new checkout)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, websiteId: requestedId } = body

    if (!planId || !['STARTER', 'PRO', 'BUSINESS'].includes(planId)) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const website = await resolveWebsite(user.id, requestedId ?? null, session.user.activeWebsiteId)
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    const result = await initiateCheckout(
      website.websiteId,
      planId,
      session.user.email,
      session.user.name || session.user.email.split('@')[0],
      '',
      userIp
    )

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ token: result.token, merchantOid: result.merchantOid })
  } catch (error) {
    console.error('[Subscription API] PATCH error:', error)
    return NextResponse.json({ error: 'Plan değiştirilemedi' }, { status: 500 })
  }
}
