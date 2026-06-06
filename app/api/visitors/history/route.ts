import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

// GET /api/visitors/history?websiteId=xxx&visitorId=xxx&page=1&limit=20
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')
    const visitorId = searchParams.get('visitorId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    // Verify team membership
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true, ownerId: true, members: { where: { userId: session.user.id } } },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'visitorTracking')
    if (planDenied) return planDenied

    // Build where clause
    const where: any = {
      websiteId: website.id,
    }
    if (visitorId) {
      where.visitorId = visitorId
    }

    const [sessions, total] = await Promise.all([
      prisma.visitorSession.findMany({
        where,
        include: {
          visitor: {
            select: {
              id: true,
              name: true,
              email: true,
              browser: true,
              os: true,
              device: true,
              country: true,
              city: true,
            },
          },
          pages: {
            orderBy: { viewedAt: 'desc' },
            take: 50,
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visitorSession.count({ where }),
    ])

    return NextResponse.json({
      sessions,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('[Visitors History API] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçi geçmişi alınamadı' }, { status: 500 })
  }
}