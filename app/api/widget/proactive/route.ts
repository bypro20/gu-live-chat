import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

/** GET /api/widget/proactive?websiteId= — Public proactive messages for embed widget */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')
    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'proactiveMessages')
    if (planDenied) return NextResponse.json([], { status: 200 })

    const messages = await prisma.proactiveMessage.findMany({
      where: { websiteId: website.id, isActive: true },
      select: {
        id: true,
        title: true,
        message: true,
        triggerType: true,
        triggerValue: true,
        targetPages: true,
        delay: true,
        showOnce: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('[Widget Proactive]', error)
    return NextResponse.json([], { status: 200 })
  }
}
