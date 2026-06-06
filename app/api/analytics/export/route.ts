import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWebsiteAccess, isErrorResponse } from '@/lib/middleware'

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '')
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const access = await requireWebsiteAccess(req, {
    planFeature: { feature: 'advancedAnalytics' },
  })
  if (isErrorResponse(access)) return access

  const { website } = access
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '30d'
  const type = searchParams.get('type') || 'conversations'

  const now = new Date()
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  let csv = ''
  let filename = `gu-chat-${type}-${period}.csv`

  if (type === 'conversations') {
    const conversations = await prisma.conversation.findMany({
      where: { websiteId: website.id, createdAt: { gte: startDate } },
      include: {
        visitor: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        messages: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    csv = toCsv(
      conversations.map((c) => ({
        id: c.id,
        durum: c.status,
        ziyaretci: c.visitor?.name || c.visitor?.email || 'Anonim',
        temsilci: c.assignedTo?.name || c.assignedTo?.email || '-',
        mesaj_sayisi: c.messages.length,
        olusturma: c.createdAt.toISOString(),
        kapanma: c.closedAt?.toISOString() || '-',
      }))
    )
  } else if (type === 'visitors') {
    const visitors = await prisma.visitor.findMany({
      where: { websiteId: website.id, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
    })

    csv = toCsv(
      visitors.map((v) => ({
        id: v.id,
        isim: v.name || '-',
        email: v.email || '-',
        ulke: v.country || '-',
        sehir: v.city || '-',
        tarayici: v.browser || '-',
        cihaz: v.device || '-',
        ilk_ziyaret: v.createdAt.toISOString(),
      }))
    )
    filename = `gu-chat-visitors-${period}.csv`
  } else if (type === 'team') {
    const members = await prisma.teamMember.findMany({
      where: { websiteId: website.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    const counts = await Promise.all(
      members.map((m) =>
        prisma.conversation.count({
          where: { websiteId: website.id, assignedToId: m.user.id, createdAt: { gte: startDate } },
        })
      )
    )

    csv = toCsv(
      members.map((m, i) => ({
        isim: m.user.name || '-',
        email: m.user.email,
        rol: m.role,
        atanan_sohbet: counts[i],
      }))
    )
    filename = `gu-chat-team-${period}.csv`
  } else {
    return NextResponse.json({ error: 'Geçersiz export tipi' }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
