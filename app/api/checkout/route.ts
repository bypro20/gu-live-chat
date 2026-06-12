import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { detectLocaleContext } from '@/lib/locale-server'
import { initiateRegionalCheckout } from '@/lib/checkout'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, websiteId: requestedId, returnTo } = body

    if (!planId || !['STARTER', 'PRO', 'BUSINESS'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    const localeCtx = detectLocaleContext(request)

    const result = await initiateRegionalCheckout({
      websiteId: website.websiteId,
      planId,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split('@')[0],
      userPhone: '',
      userIp,
      returnTo: returnTo === 'plans' ? 'plans' : 'billing',
      region: localeCtx.region,
      currency: localeCtx.currency,
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[checkout] Error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
