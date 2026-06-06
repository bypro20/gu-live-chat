import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { sendEmail } from '@/lib/email'
import { PLAN_LIMITS } from '@/lib/constants'

// POST /api/campaigns/send — Send a campaign to its target audience
// Supports EMAIL type campaigns only for now.
// Runs synchronously for small lists; large deployments should move to a queue.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const { campaignId } = await req.json()
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId gerekli' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { website: { select: { id: true, websiteId: true, name: true, plan: true } } },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    }

    // Owner/admin only
    const member = await prisma.teamMember.findFirst({
      where: { websiteId: campaign.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    // Plan gate
    if (!PLAN_LIMITS[campaign.website.plan].campaigns) {
      return NextResponse.json(
        { error: 'Kampanya gönderme bu plan kapsamında mevcut değil' },
        { status: 403 }
      )
    }

    if (campaign.type !== 'EMAIL') {
      return NextResponse.json(
        { error: 'Şu an yalnızca EMAIL tipi kampanyalar destekleniyor' },
        { status: 400 }
      )
    }

    if (!campaign.subject || !campaign.content) {
      return NextResponse.json(
        { error: 'Kampanya konusu ve içeriği boş olamaz' },
        { status: 400 }
      )
    }

    if (campaign.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Bu kampanya zaten gönderildi' }, { status: 400 })
    }

    // Build recipient list based on target
    let recipientEmails: string[] = []

    if (campaign.target === 'ALL_VISITORS') {
      const visitors = await prisma.visitor.findMany({
        where: { websiteId: campaign.websiteId, email: { not: null } },
        select: { email: true },
        distinct: ['email'],
      })
      recipientEmails = visitors.map((v) => v.email!).filter(Boolean)
    } else if (campaign.target === 'ACTIVE_CONVERSATIONS') {
      const conversations = await prisma.conversation.findMany({
        where: {
          websiteId: campaign.websiteId,
          status: { in: ['OPEN', 'PENDING'] },
          visitor: { email: { not: null } },
        },
        include: { visitor: { select: { email: true } } },
      })
      const emails = conversations
        .map((c) => c.visitor.email)
        .filter(Boolean) as string[]
      recipientEmails = [...new Set(emails)]
    } else if (campaign.target === 'SEGMENTED' && campaign.segmentFilter) {
      // Segment filter: JSON with optional { country, page } fields
      try {
        const filter = JSON.parse(campaign.segmentFilter) as {
          country?: string
          page?: string
          email?: string
        }
        const visitors = await prisma.visitor.findMany({
          where: {
            websiteId: campaign.websiteId,
            email: { not: null },
            ...(filter.country ? { country: filter.country } : {}),
          },
          select: { email: true },
          distinct: ['email'],
        })
        recipientEmails = visitors.map((v) => v.email!).filter(Boolean)
        if (filter.email) {
          recipientEmails = recipientEmails.filter((e) =>
            e.toLowerCase().includes(filter.email!.toLowerCase())
          )
        }
      } catch {
        return NextResponse.json({ error: 'Segment filtresi geçersiz JSON' }, { status: 400 })
      }
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'E-posta adresi bulunan alıcı bulunamadı' }, { status: 400 })
    }

    // Mark as ACTIVE before sending
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    })

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    for (const email of recipientEmails) {
      const result = await sendEmail({
        to: email,
        subject: campaign.subject,
        html: campaign.content,
        text: campaign.content.replace(/<[^>]+>/g, ''),
        from: `${campaign.website.name} <noreply@gulive.com>`,
      })

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        errors.push(`${email}: ${result.error}`)
      }
    }

    // Mark campaign as completed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        sentAt: new Date(),
        sentCount: sentCount,
      },
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: recipientEmails.length,
      errors: errors.slice(0, 10), // Cap error list
    })
  } catch (error) {
    console.error('[Campaign Send] Error:', error)
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
