import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { initiateAddonCheckout } from '@/lib/addon-purchase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await request.json()
    const { addonSlug, websiteId: requestedId } = body

    if (!addonSlug || !requestedId) {
      return NextResponse.json({ error: 'addonSlug ve websiteId gerekli' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        role: 'OWNER',
        website: { websiteId: requestedId },
      },
      select: { website: { select: { websiteId: true } } },
    })

    if (!membership?.website) {
      return NextResponse.json({ error: 'Site sahibi olmalısınız' }, { status: 403 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    const result = await initiateAddonCheckout(
      membership.website.websiteId,
      addonSlug,
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
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
    })
  } catch (error) {
    console.error('[iyzico addon-checkout] Error:', error)
    return NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 })
  }
}
