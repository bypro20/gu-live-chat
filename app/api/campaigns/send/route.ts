import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { sendEmail } from '@/lib/email'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

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

    const planDenied = await planFeatureDeniedAsync(campaign.website.id, campaign.website.plan, 'campaigns')
    if (planDenied) return planDenied

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

    if (campaign.abTestEnabled && (!campaign.variantBSubject || !campaign.variantBContent)) {
      return NextResponse.json(
        { error: 'A/B testi için B varyantının konusu ve içeriği gerekli' },
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
    let variantASent = 0
    let variantBSent = 0
    const errors: string[] = []

    const splitPercent = campaign.abTestEnabled
      ? Math.min(99, Math.max(1, campaign.abSplitPercent))
      : 100

    for (const email of recipientEmails) {
      const useVariantA = !campaign.abTestEnabled || Math.random() * 100 < splitPercent
      const subject = useVariantA ? campaign.subject! : campaign.variantBSubject!
      const content = useVariantA ? campaign.content! : campaign.variantBContent!

      const result = await sendEmail({
        to: email,
        subject,
        html: content,
        text: content.replace(/<[^>]+>/g, ''),
        from: `${campaign.website.name} <noreply@gulive.com>`,
      })

      if (result.success) {
        sentCount++
        if (campaign.abTestEnabled) {
          if (useVariantA) variantASent++
          else variantBSent++
        }
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
        ...(campaign.abTestEnabled
          ? {
              variantASentCount: { increment: variantASent },
              variantBSentCount: { increment: variantBSent },
            }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: recipientEmails.length,
      ...(campaign.abTestEnabled ? { variantASent, variantBSent } : {}),
      errors: errors.slice(0, 10), // Cap error list
    })
  } catch (error) {
    console.error('[Campaign Send] Error:', error)
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
