import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { initiateCheckout } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, websiteId: requestedId, returnTo } = body

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

    const candidates = [requestedId, session.user.activeWebsiteId].filter(Boolean) as string[]

    let website: { websiteId: string } | null = null
    for (const wid of candidates) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          website: { websiteId: wid },
        },
        select: { website: { select: { websiteId: true } } },
      })
      if (membership?.website) {
        website = membership.website
        break
      }
    }

    if (!website) {
      website = await prisma.website.findFirst({
        where: { ownerId: user.id },
        select: { websiteId: true },
      })
    }

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
      userIp,
      returnTo === 'plans' ? 'plans' : 'billing'
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
    console.error('[iyzico checkout] Error:', error)
    return NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 })
  }
}
