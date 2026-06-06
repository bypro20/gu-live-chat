import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateAiReply } from '@/lib/ai/provider'
import { loadKnowledge, toChatMessages } from '@/lib/ai/knowledge'

const HISTORY_LIMIT = 12

/**
 * POST /api/conversations/[conversationId]/ai-suggest
 * Returns a suggested agent reply for the given conversation. Uses a real
 * LLM when an API key is configured (env or per-website DB), otherwise a
 * knowledge/rule-based fallback. The agent can edit before sending.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
    }

    const { conversationId } = await params

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        websiteId: true,
        website: { select: { id: true, name: true, aiConfig: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: conversation.websiteId, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const recent = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { content: true, senderType: true },
    })
    const ordered = recent.reverse()
    const messages = toChatMessages(ordered)

    if (messages.length === 0) {
      return NextResponse.json({
        suggestion: 'Merhaba! Size nasıl yardımcı olabilirim?',
      })
    }

    const knowledge = await loadKnowledge(conversation.websiteId)
    const aiConfig = conversation.website.aiConfig

    const suggestion = await generateAiReply({
      siteName: conversation.website.name,
      messages,
      knowledge,
      systemPrompt: aiConfig?.systemPrompt || undefined,
      dbConfig: aiConfig
        ? {
            provider: aiConfig.provider,
            model: aiConfig.model,
            apiKey: aiConfig.apiKey,
            temperature: aiConfig.temperature,
          }
        : null,
      websiteId: conversation.websiteId,
      conversationId,
    })

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[AI suggest] Error:', error)
    return NextResponse.json({ error: 'AI önerisi oluşturulamadı' }, { status: 500 })
  }
}
