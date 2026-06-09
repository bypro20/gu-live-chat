import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateAiReply, isAiLlmAvailable } from '@/lib/ai/provider'
import { loadKnowledge } from '@/lib/ai/knowledge'
import { websiteHasAiAssistant } from '@/lib/plan-features'

/** POST /api/ai/test — panelden AI yanıtını dene */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await req.json()
    const { websiteId, message } = body as { websiteId?: string; message?: string }
    if (!websiteId || !message?.trim()) {
      return NextResponse.json({ error: 'websiteId ve message gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: {
        id: true,
        name: true,
        plan: true,
        ownerId: true,
        members: { where: { userId: session.user.id } },
        aiConfig: true,
      },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const hasAi = await websiteHasAiAssistant(website.id, website.plan)
    if (!hasAi) {
      return NextResponse.json({ error: 'AI asistan bu planda kullanılamaz' }, { status: 403 })
    }

    const aiConfig = website.aiConfig
    const dbConfig = aiConfig
      ? {
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
          temperature: aiConfig.temperature,
        }
      : null

    const knowledge = await loadKnowledge(website.id)
    const reply = await generateAiReply({
      siteName: website.name,
      messages: [{ role: 'user', content: message.trim() }],
      knowledge,
      systemPrompt: aiConfig?.systemPrompt || undefined,
      dbConfig,
      websiteId: website.id,
    })

    return NextResponse.json({
      ok: true,
      reply,
      mode: isAiLlmAvailable(dbConfig) ? 'llm' : 'fallback',
    })
  } catch (error) {
    console.error('[AI Test]', error)
    return NextResponse.json({ error: 'Test yanıtı alınamadı' }, { status: 500 })
  }
}
