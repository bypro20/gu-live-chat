import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getSubscriptionStatus,
  cancelSubscription,
  initiateCheckout,
} from '@/lib/subscription'

// GET — Get current subscription status
export async function GET() {
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

    const website = await prisma.website.findFirst({
      where: { ownerId: user.id },
      select: { websiteId: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const subscription = await getSubscriptionStatus(website.websiteId)
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('[Subscription API] GET error:', error)
    return NextResponse.json(
      { error: 'Abonelik durumu alınamadı' },
      { status: 500 }
    )
  }
}

// POST — Cancel subscription
export async function POST() {
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

    const website = await prisma.website.findFirst({
      where: { ownerId: user.id },
      select: { websiteId: true, plan: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    if (website.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Zaten ücretsiz plan aktif' },
        { status: 400 }
      )
    }

    await cancelSubscription(website.websiteId)

    return NextResponse.json({ success: true, message: 'Abonelik iptal edildi' })
  } catch (error) {
    console.error('[Subscription API] POST error:', error)
    return NextResponse.json(
      { error: 'Abonelik iptal edilemedi' },
      { status: 500 }
    )
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
    const { planId } = body

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

    const website = await prisma.website.findFirst({
      where: { ownerId: user.id },
      select: { websiteId: true },
    })

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

    return NextResponse.json({
      token: result.token,
      merchantOid: result.merchantOid,
    })
  } catch (error) {
    console.error('[Subscription API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Plan değiştirilemedi' },
      { status: 500 }
    )
  }
}