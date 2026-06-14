import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { isValidCustomerEmbedUrl, isWidgetPlatformUrl, normalizeExternalUrl } from '@/lib/widget-embed-url'

const pageviewSchema = z.object({
  sessionId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  referrer: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = pageviewSchema.parse(body)

    const session = await prisma.visitorSession.findUnique({
      where: { sessionId: validated.sessionId },
      include: {
        website: { select: { id: true, websiteId: true } },
        visitor: { select: { id: true } },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
    }

    if (!isValidCustomerEmbedUrl(validated.url)) {
      return NextResponse.json({ error: 'Geçersiz embed sayfası' }, { status: 400 })
    }

    const embedUrl = normalizeExternalUrl(validated.url)!
    const landingWasWrong =
      !session.landingPage ||
      isWidgetPlatformUrl(session.landingPage) ||
      !isValidCustomerEmbedUrl(session.landingPage)

    // Update session's current page and last active time
    await prisma.visitorSession.update({
      where: { id: session.id },
      data: {
        currentPage: embedUrl,
        currentTitle: validated.title || null,
        lastActiveAt: new Date(),
        ...(landingWasWrong ? { landingPage: embedUrl } : {}),
      },
    })

    // Create a page view record
    await prisma.pageView.create({
      data: {
        sessionId: session.id,
        url: embedUrl,
        title: validated.title || null,
      },
    })

    const { runWorkflows } = await import('@/lib/workflow-runner')
    await runWorkflows('VISITOR_SEEN_PAGE', {
      websiteDbId: session.website.id,
      websitePublicId: session.website.websiteId,
      visitorId: session.visitor.id,
      pageUrl: embedUrl,
      pageTitle: validated.title,
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('Pageview error:', error)
    return NextResponse.json({ error: 'Sayfa görüntülenme kaydı başarısız' }, { status: 500 })
  }
}