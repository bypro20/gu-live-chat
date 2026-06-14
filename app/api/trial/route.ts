import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { startTrial, getTrialInfo } from '@/lib/trial'
import {
  initiateTrialCheckout,
  websiteHasSavedPaymentMethod,
} from '@/lib/trial-checkout'
import { isIyzicoConfigured } from '@/lib/iyzico'

async function assertTrialAccess(websiteId: string, userId: string) {
  const website = await resolveWebsite(websiteId)
  if (!website) {
    return { error: NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 }) }
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) {
    return { error: NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 }) }
  }

  return { website }
}

// POST /api/trial — Kart kayıtlıysa denemeyi başlat; değilse iyzico kart formu döndür
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { websiteId } = body as { websiteId: string }

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const access = await assertTrialAccess(websiteId, session.user.id)
  if ('error' in access && access.error) return access.error

  const trialInfo = await getTrialInfo(websiteId)
  if (trialInfo.trialUsed) {
    return NextResponse.json({ error: 'Deneme süresi zaten kullanılmış' }, { status: 400 })
  }
  if (trialInfo.isTrialing) {
    return NextResponse.json({ error: 'Deneme süresi zaten aktif' }, { status: 400 })
  }

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      paytrUserToken: true,
      paytrCardToken: true,
      subscriptionStatus: true,
      plan: true,
      currentPeriodEnd: true,
    },
  })
  if (!website) {
    return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
  }

  // Aktif ücretli abonelik varsa deneme gerekmez — doğrudan başlat (bakiye / ödenmiş dönem)
  const hasActivePaidPeriod =
    website.subscriptionStatus === 'ACTIVE' &&
    website.plan !== 'FREE' &&
    website.currentPeriodEnd !== null &&
    website.currentPeriodEnd > new Date()

  if (hasActivePaidPeriod || websiteHasSavedPaymentMethod(website)) {
    try {
      const result = await startTrial(websiteId)
      return NextResponse.json({
        success: true,
        started: true,
        trialEndsAt: result.trialEndsAt,
        trialPlan: result.trialPlan,
      })
    } catch (error) {
      console.error('Failed to start trial:', error)
      return NextResponse.json({ error: 'Deneme süresi başlatılamadı' }, { status: 500 })
    }
  }

  if (!isIyzicoConfigured()) {
    return NextResponse.json(
      { error: 'Denemeyi başlatmak için ödeme sistemi yapılandırılmalı ve kart bilgisi gerekli' },
      { status: 400 }
    )
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

  const checkout = await initiateTrialCheckout(
    websiteId,
    session.user.email || '',
    session.user.name || session.user.email?.split('@')[0] || 'Müşteri',
    '',
    userIp
  )

  if ('error' in checkout) {
    return NextResponse.json({ error: checkout.error }, { status: 400 })
  }

  return NextResponse.json({
    requiresCheckout: true,
    checkoutFormContent: checkout.checkoutFormContent,
    paymentPageUrl: checkout.paymentPageUrl,
    token: checkout.token,
    merchantOid: checkout.merchantOid,
  })
}

// GET /api/trial — Get trial info for a website
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteId)
  if (!website) {
    return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
  }
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const trialInfo = await getTrialInfo(websiteId)
  const payment = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      paytrUserToken: true,
      paytrCardToken: true,
      subscriptionStatus: true,
      plan: true,
      currentPeriodEnd: true,
    },
  })

  const hasSavedCard = payment ? websiteHasSavedPaymentMethod(payment) : false
  const hasActivePaidPeriod =
    payment?.subscriptionStatus === 'ACTIVE' &&
    payment.plan !== 'FREE' &&
    payment.currentPeriodEnd !== null &&
    payment.currentPeriodEnd > new Date()

  return NextResponse.json({
    ...trialInfo,
    hasSavedCard,
    canStartImmediately: hasSavedCard || hasActivePaidPeriod,
  })
}
