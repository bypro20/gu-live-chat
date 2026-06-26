import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getWhatsAppConfig } from '@/lib/channels/whatsapp-delivery'
import { sendWhatsAppMessage } from '@/lib/channels/whatsapp'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return null
  return digits
}

function phoneFromVisitor(fingerprint: string, phone: string | null): string | null {
  if (fingerprint.startsWith('wa_')) {
    return normalizePhone(fingerprint.slice(3))
  }
  if (phone) return normalizePhone(phone)
  return null
}

async function resolveRecipientPhones(websiteId: string, target: string, segmentFilter: string | null) {
  if (target === 'ALL_VISITORS') {
    const visitors = await prisma.visitor.findMany({
      where: { websiteId },
      select: { fingerprint: true, phone: true },
    })
    return [...new Set(visitors.map((v) => phoneFromVisitor(v.fingerprint, v.phone)).filter(Boolean))] as string[]
  }

  if (target === 'ACTIVE_CONVERSATIONS') {
    const conversations = await prisma.conversation.findMany({
      where: { websiteId, status: { in: ['OPEN', 'PENDING'] } },
      include: { visitor: { select: { fingerprint: true, phone: true } } },
    })
    return [
      ...new Set(
        conversations
          .map((c) => phoneFromVisitor(c.visitor.fingerprint, c.visitor.phone))
          .filter(Boolean)
      ),
    ] as string[]
  }

  if (target === 'SEGMENTED' && segmentFilter) {
    const filter = JSON.parse(segmentFilter) as { country?: string }
    const visitors = await prisma.visitor.findMany({
      where: {
        websiteId,
        ...(filter.country ? { country: filter.country } : {}),
      },
      select: { fingerprint: true, phone: true },
    })
    return [...new Set(visitors.map((v) => phoneFromVisitor(v.fingerprint, v.phone)).filter(Boolean))] as string[]
  }

  return []
}

/** POST /api/campaigns/send — EMAIL veya WhatsApp kampanyası gönder */
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

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: campaign.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const planDenied = await planFeatureDeniedAsync(campaign.website.id, campaign.website.plan, 'campaigns')
    if (planDenied) return planDenied

    const campaignType = campaign.type as string
    if (campaignType !== 'EMAIL' && campaignType !== 'WHATSAPP') {
      return NextResponse.json(
        { error: 'Şu an yalnızca EMAIL ve WHATSAPP tipi kampanyalar destekleniyor' },
        { status: 400 }
      )
    }

    if (!campaign.content?.trim()) {
      return NextResponse.json({ error: 'Kampanya içeriği boş olamaz' }, { status: 400 })
    }

    if (campaign.type === 'EMAIL' && !campaign.subject?.trim()) {
      return NextResponse.json({ error: 'E-posta konusu boş olamaz' }, { status: 400 })
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

    if (campaignType === 'EMAIL') {
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
        recipientEmails = [...new Set(conversations.map((c) => c.visitor.email).filter(Boolean) as string[])]
      } else if (campaign.target === 'SEGMENTED' && campaign.segmentFilter) {
        try {
          const filter = JSON.parse(campaign.segmentFilter) as { country?: string; email?: string }
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

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          sentAt: new Date(),
          sentCount,
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
        errors: errors.slice(0, 10),
      })
    }

    if (campaignType === 'WHATSAPP') {
      const waConfig = await getWhatsAppConfig(campaign.websiteId)
      if (!waConfig) {
        return NextResponse.json({ error: 'WhatsApp kanalı yapılandırılmamış' }, { status: 400 })
      }

      let phones: string[] = []
      try {
        phones = await resolveRecipientPhones(campaign.websiteId, campaign.target, campaign.segmentFilter)
      } catch {
        return NextResponse.json({ error: 'Segment filtresi geçersiz JSON' }, { status: 400 })
      }

      if (phones.length === 0) {
        return NextResponse.json({ error: 'Telefon numarası bulunan alıcı yok' }, { status: 400 })
      }

      const plainContent = campaign.content.replace(/<[^>]+>/g, '').trim()

      for (const phone of phones) {
        const useVariantA = !campaign.abTestEnabled || Math.random() * 100 < splitPercent
        const content = useVariantA
          ? plainContent
          : (campaign.variantBContent || plainContent).replace(/<[^>]+>/g, '').trim()
        const result = await sendWhatsAppMessage(waConfig, phone, content)
        if (result.success) {
          sentCount++
          if (campaign.abTestEnabled) {
            if (useVariantA) variantASent++
            else variantBSent++
          }
        } else {
          failedCount++
          errors.push(`${phone}: ${result.error}`)
        }
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          sentAt: new Date(),
          sentCount,
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
        total: phones.length,
        ...(campaign.abTestEnabled ? { variantASent, variantBSent } : {}),
        errors: errors.slice(0, 10),
      })
    }

    return NextResponse.json({ error: 'Desteklenmeyen kampanya tipi' }, { status: 400 })
  } catch (error) {
    console.error('[Campaign Send] Error:', error)
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
