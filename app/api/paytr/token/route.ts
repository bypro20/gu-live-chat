import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { initiateCheckout } from '@/lib/subscription'

export async function POST(request: NextRequest) {
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

    // Get user's website
    const { prisma } = await import('@/lib/db')
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

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const userIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    const result = await initiateCheckout(
      website.websiteId,
      planId,
      session.user.email,
      session.user.name || session.user.email.split('@')[0],
      '', // Phone — not required
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
    console.error('[PayTR Token API] Error:', error)
    return NextResponse.json(
      { error: 'Ödeme başlatılamadı' },
      { status: 500 }
    )
  }
}