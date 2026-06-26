import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'

/** GET /api/ai/insights?websiteId= — duygu dağılımı ve AI metrikleri */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const websiteId = req.nextUrl.searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteId)
  if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [sentimentRows, botCount, handoffRows, ragChunks, intentRows, aiResolvedRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ sentiment: string | null; n: number }>>(
      `SELECT m."sentiment", COUNT(*) as n FROM "messages" m
       INNER JOIN "conversations" c ON c."id" = m."conversationId"
       WHERE c."websiteId" = ? AND m."senderType" = 'VISITOR' AND m."createdAt" >= ?
       GROUP BY m."sentiment"`,
      website.id,
      since.toISOString()
    ),
    prisma.message.count({
      where: {
        senderType: 'BOT',
        createdAt: { gte: since },
        conversation: { websiteId: website.id },
      },
    }),
    prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*) as n FROM "conversations"
       WHERE "websiteId" = ? AND "aiHandoffSummary" IS NOT NULL AND "updatedAt" >= ?`,
      website.id,
      since.toISOString()
    ),
    prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*) as n FROM "knowledge_chunks" WHERE "websiteId" = ?`,
      website.id
    ),
    prisma.$queryRawUnsafe<Array<{ word: string; n: number }>>(
      `SELECT LOWER(TRIM(m."content")) as word, COUNT(*) as n FROM "messages" m
       INNER JOIN "conversations" c ON c."id" = m."conversationId"
       WHERE c."websiteId" = ? AND m."senderType" = 'VISITOR' AND m."createdAt" >= ?
         AND LENGTH(TRIM(m."content")) BETWEEN 3 AND 40
       GROUP BY LOWER(TRIM(m."content"))
       ORDER BY n DESC
       LIMIT 8`,
      website.id,
      since.toISOString()
    ),
    prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*) as n FROM "conversations"
       WHERE "websiteId" = ? AND "status" IN ('RESOLVED', 'CLOSED')
         AND "assignedToId" IS NULL AND "updatedAt" >= ?`,
      website.id,
      since.toISOString()
    ),
  ])

  const sentiment = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 }
  for (const row of sentimentRows) {
    const key = (row.sentiment || 'NEUTRAL') as keyof typeof sentiment
    if (key in sentiment) sentiment[key] = Number(row.n)
  }

  return NextResponse.json({
    periodDays: 30,
    sentiment,
    botReplies: botCount,
    aiHandoffs: Number(handoffRows[0]?.n ?? 0),
    ragChunks: Number(ragChunks[0]?.n ?? 0),
    aiResolved: Number(aiResolvedRows[0]?.n ?? 0),
    topIntents: intentRows
      .filter((row) => row.word && !/^\d+$/.test(row.word))
      .map((row) => ({ text: row.word, count: Number(row.n) })),
  })
}
