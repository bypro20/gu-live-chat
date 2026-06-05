import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { websiteId, visitorId, consentType, granted, ipAddress, userAgent } = body

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({ where: { websiteId } })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    const consent = await prisma.gDPRConsent.create({
      data: {
        websiteId: website.id,
        visitorId: visitorId || null,
        consentType: consentType || 'GDPR',
        granted: granted ?? false,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })

    return NextResponse.json(consent, { status: 201 })
  } catch (error: unknown) {
    console.error('Consent log error:', error)
    return NextResponse.json({ error: 'Onay kaydedilemedi' }, { status: 500 })
  }
}
