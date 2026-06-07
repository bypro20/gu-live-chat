import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** GET /api/widget/privacy?websiteId= — Public privacy/consent config for embed */
export async function GET(req: Request) {
  try {
    const websiteId = new URL(req.url).searchParams.get('websiteId')
    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: {
        showConsentBanner: true,
        consentBannerText: true,
        cookieConsentEnabled: true,
        cookieConsentText: true,
        privacyPolicyUrl: true,
      },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      showConsentBanner: website.showConsentBanner,
      consentBannerText: website.consentBannerText,
      cookieConsentEnabled: website.cookieConsentEnabled,
      cookieConsentText: website.cookieConsentText,
      privacyPolicyUrl: website.privacyPolicyUrl,
    })
  } catch {
    return NextResponse.json({ showConsentBanner: true }, { status: 200 })
  }
}
