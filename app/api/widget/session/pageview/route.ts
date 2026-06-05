import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

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

    // Find the session
    const session = await prisma.visitorSession.findUnique({
      where: { sessionId: validated.sessionId },
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
    }

    // Update session's current page and last active time
    await prisma.visitorSession.update({
      where: { id: session.id },
      data: {
        currentPage: validated.url,
        currentTitle: validated.title || null,
        lastActiveAt: new Date(),
      },
    })

    // Create a page view record
    await prisma.pageView.create({
      data: {
        sessionId: session.sessionId,
        url: validated.url,
        title: validated.title || null,
        viewedAt: new Date(),
      },
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