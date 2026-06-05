import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      id: true,
      showConsentBanner: true,
      consentBannerText: true,
      cookieConsentEnabled: true,
      cookieConsentText: true,
      privacyPolicyUrl: true,
      dataRetentionPolicy: true,
    },
  })

  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  return NextResponse.json({
    showConsentBanner: website.showConsentBanner,
    consentBannerText: website.consentBannerText,
    cookieConsentEnabled: website.cookieConsentEnabled,
    cookieConsentText: website.cookieConsentText,
    privacyPolicyUrl: website.privacyPolicyUrl,
    retentionPolicy: website.dataRetentionPolicy,
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { websiteId, showConsentBanner, consentBannerText, cookieConsentEnabled, cookieConsentText, privacyPolicyUrl, visitorDataDays, sessionDataDays, chatHistoryDays, autoDelete } = body
    if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

    const website = await prisma.website.findUnique({ where: { websiteId } })
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.website.update({
        where: { websiteId },
        data: {
          showConsentBanner: showConsentBanner ?? true,
          consentBannerText: consentBannerText ?? null,
          cookieConsentEnabled: cookieConsentEnabled ?? true,
          cookieConsentText: cookieConsentText ?? null,
          privacyPolicyUrl: privacyPolicyUrl ?? null,
        },
      })

      const retentionPolicy = await tx.dataRetentionPolicy.upsert({
        where: { websiteId: website.id },
        create: {
          websiteId: website.id,
          visitorDataDays: visitorDataDays ?? 365,
          sessionDataDays: sessionDataDays ?? 90,
          chatHistoryDays: chatHistoryDays ?? 730,
          autoDelete: autoDelete ?? false,
        },
        update: {
          visitorDataDays: visitorDataDays ?? 365,
          sessionDataDays: sessionDataDays ?? 90,
          chatHistoryDays: chatHistoryDays ?? 730,
          autoDelete: autoDelete ?? false,
        },
      })

      return { website: updated, retentionPolicy }
    })

    return NextResponse.json({
      showConsentBanner: result.website.showConsentBanner,
      consentBannerText: result.website.consentBannerText,
      cookieConsentEnabled: result.website.cookieConsentEnabled,
      cookieConsentText: result.website.cookieConsentText,
      privacyPolicyUrl: result.website.privacyPolicyUrl,
      retentionPolicy: result.retentionPolicy,
    })
  } catch (error: unknown) {
    console.error('Update privacy settings error:', error)
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi' }, { status: 500 })
  }
}
