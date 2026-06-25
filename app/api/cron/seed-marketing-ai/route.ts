import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { resolveMarketingWebsiteId } from '@/lib/marketing-website'
import { ensureMarketingSiteAiReady } from '@/lib/marketing-ai-setup'
import { hasAnyPlatformAiKey } from '@/lib/ai/provider'

/** GET /api/cron/seed-marketing-ai — gulivechat.com widget bilgi bankası + AI config */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const marketingPublicId = await resolveMarketingWebsiteId()
    if (!marketingPublicId) {
      return NextResponse.json({ ok: false, error: 'Marketing website not found' }, { status: 404 })
    }

    const site = await prisma.website.findUnique({
      where: { websiteId: marketingPublicId },
      select: { id: true, websiteId: true, name: true },
    })
    if (!site) {
      return NextResponse.json({ ok: false, error: 'Marketing website row missing' }, { status: 404 })
    }

    await ensureMarketingSiteAiReady(site.id)

    const [articleCount, aiConfig] = await Promise.all([
      prisma.knowledgeArticle.count({ where: { websiteId: site.id, status: 'PUBLISHED' } }),
      prisma.aIConfig.findUnique({
        where: { websiteId: site.id },
        select: { isActive: true, autoReply: true, provider: true, model: true },
      }),
    ])

    return NextResponse.json({
      ok: true,
      marketingWebsiteId: site.websiteId,
      knowledgeArticles: articleCount,
      aiConfig,
      platformAiKey: hasAnyPlatformAiKey(),
    })
  } catch (error) {
    console.error('[cron/seed-marketing-ai]', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
