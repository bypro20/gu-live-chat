import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { runCopilot, type CopilotMode } from '@/lib/ai/copilot'
import { loadRelevantKnowledge, toChatMessages } from '@/lib/ai/knowledge'
import { websiteHasAiAssistant } from '@/lib/plan-features'
import { sessionIsPlatformAdmin } from '@/lib/platform-admin'
import type { PlanType } from '@/lib/constants'

const MODES: CopilotMode[] = [
  'suggest',
  'professional',
  'friendly',
  'shorten',
  'expand',
  'grammar',
  'translate_tr',
]

/** POST /api/ai/copilot — temsilci metin önerisi / düzenleme */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const conversationId = body.conversationId as string
    const mode = (body.mode || 'suggest') as CopilotMode
    const draft = (body.draft as string) || ''

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId gerekli' }, { status: 400 })
    }
    if (!MODES.includes(mode)) {
      return NextResponse.json({ error: 'Geçersiz mod' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        websiteId: true,
        website: { select: { id: true, name: true, plan: true, aiConfig: true } },
      },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: conversation.websiteId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const adminBypass = await sessionIsPlatformAdmin()
    const hasAi =
      adminBypass ||
      (await websiteHasAiAssistant(conversation.website.id, conversation.website.plan))
    if (!hasAi) {
      return NextResponse.json({ error: 'AI bu planda mevcut değil', upgradeRequired: true }, { status: 403 })
    }

    const aiConfig = conversation.website.aiConfig
    if (!aiConfig?.isActive || !aiConfig.autoSuggest) {
      return NextResponse.json({ error: 'AI Copilot kapalı' }, { status: 403 })
    }

    const recent = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { content: true, senderType: true },
    })
    const messages = toChatMessages(recent.reverse())

    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    const knowledge = lastUser
      ? await loadRelevantKnowledge(conversation.website.id, lastUser, 6)
      : []

    const dbConfig = {
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      temperature: aiConfig.temperature,
    }

    const suggestion = await runCopilot({
      siteName: conversation.website.name,
      messages,
      draft,
      mode,
      knowledge,
      systemPrompt: aiConfig.systemPrompt || undefined,
      dbConfig,
      plan: conversation.website.plan as PlanType,
    })

    return NextResponse.json({ suggestion: suggestion?.trim() || '', mode, knowledgeUsed: knowledge.length })
  } catch (err) {
    console.error('[copilot]', err)
    return NextResponse.json({ error: 'Copilot yanıtı alınamadı' }, { status: 500 })
  }
}
