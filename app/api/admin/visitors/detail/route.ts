import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

/** GET /api/admin/visitors/detail?visitorId=xxx */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const visitorId = new URL(req.url).searchParams.get('visitorId')
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId gerekli' }, { status: 400 })
    }

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        browser: true,
        os: true,
        device: true,
        timezone: true,
      },
    })

    if (!visitor) {
      return NextResponse.json({ error: 'Ziyaretçi bulunamadı' }, { status: 404 })
    }

    const [session, conversation] = await Promise.all([
      prisma.visitorSession.findFirst({
        where: { visitorId },
        orderBy: { lastActiveAt: 'desc' },
        select: {
          ipAddress: true,
          isp: true,
          region: true,
          latitude: true,
          longitude: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          referrer: true,
          pages: { orderBy: { viewedAt: 'desc' }, take: 10 },
        },
      }),
      prisma.conversation.findFirst({
        where: { visitorId },
        orderBy: { lastMessageAt: 'desc' },
        select: { id: true, status: true, lastMessageAt: true },
      }),
    ])

    return NextResponse.json({
      visitor: {
        ...visitor,
        ipAddress: session?.ipAddress || null,
        isp: session?.isp || null,
        region: session?.region || null,
        latitude: session?.latitude || null,
        longitude: session?.longitude || null,
        utm_source: session?.utmSource || null,
        utm_medium: session?.utmMedium || null,
        utm_campaign: session?.utmCampaign || null,
        referrer: session?.referrer || null,
      },
      pages: session?.pages || [],
      hasConversation: !!conversation,
      conversationId: conversation?.id || null,
      conversationStatus: conversation?.status || null,
    })
  } catch (error) {
    console.error('[Admin Visitor Detail] Error:', error)
    return NextResponse.json({ error: 'Detay alınamadı' }, { status: 500 })
  }
}
