import { prisma } from '../db'
import { emitBotMessage } from '../socket-events'
import { generateAiReply, isAiLlmAvailable } from './provider'
import { loadKnowledge, toChatMessages } from './knowledge'
import { loadVisitorContext } from './visitor-context'
import { isChatbotWaitingForInput } from '../chatbot-runner'
import { deliverChannelReply } from '../channels/deliver-reply'
import { websiteHasAiAssistant } from '../plan-features'
import { isAdminOwnedWebsite } from '../admin-website'
import { matchFaqFromKnowledge } from './faq-matcher'
import { ensureAiConfig } from './ensure-config'
import type { PlanType } from '../constants'

const HISTORY_LIMIT = 20

interface AutoReplyParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId?: string
}

async function sendBotReply(
  params: AutoReplyParams,
  content: string,
  siteName: string
): Promise<void> {
  const botMessage = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      content,
      type: 'TEXT',
      senderType: 'BOT',
      status: 'SENT',
    },
  })

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: content.substring(0, 100),
    },
  })

  emitBotMessage({
    conversationId: params.conversationId,
    websiteId: params.websitePublicId,
    message: {
      id: botMessage.id,
      content: botMessage.content,
      senderName: siteName,
      createdAt: botMessage.createdAt,
    },
  })

  await deliverChannelReply(params.conversationId, content)
}

/**
 * Hibrit AI Agent: önce bilgi bankası SSS eşleşmesi, sonra LLM.
 * Temsilci atanmadığı sürece standart talepleri otomatik yanıtlar.
 */
export async function maybeRunAiAutoReply(params: AutoReplyParams): Promise<void> {
  try {
    const waiting = await isChatbotWaitingForInput(params.conversationId)
    if (waiting) return

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      select: {
        id: true,
        assignedToId: true,
        chatbotCompleted: true,
        chatbotHandedToAi: true,
        chatbotId: true,
        visitorId: true,
        website: { select: { id: true, name: true, plan: true } },
      },
    })

    if (!conversation) return
    if (conversation.assignedToId) return

    const hasAi =
      (await isAdminOwnedWebsite(params.websiteDbId)) ||
      (await websiteHasAiAssistant(params.websiteDbId, conversation.website.plan))
    if (!hasAi) return

    if (conversation.chatbotId && !conversation.chatbotCompleted && !conversation.chatbotHandedToAi) {
      return
    }

    let aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: params.websiteDbId },
    })
    if (!aiConfig) {
      aiConfig = await ensureAiConfig(params.websiteDbId)
    }

    if (!aiConfig || !aiConfig.isActive || !aiConfig.autoReply) return

    const recent = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { content: true, senderType: true },
    })
    const ordered = recent.reverse()

    const last = ordered[ordered.length - 1]
    if (!last || last.senderType !== 'VISITOR') return

    const knowledge = await loadKnowledge(params.websiteDbId)
    const siteName = (conversation.website.name || 'Destek').trim()

    const dbConfig = {
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      temperature: aiConfig.temperature,
    }
    const llmReady = isAiLlmAvailable(dbConfig)

    // Kesin SSS eşleşmesi (LLM varken sadece yüksek güven)
    const faqHit = matchFaqFromKnowledge(last.content, knowledge)
    const faqThreshold = llmReady ? 0.88 : 0.5
    if (faqHit && faqHit.confidence >= faqThreshold) {
      await sendBotReply(params, faqHit.answer, siteName)
      return
    }

    const messages = toChatMessages(ordered)
    if (messages.length === 0) return

    const visitorContext = await loadVisitorContext(params.visitorId || conversation.visitorId)

    const reply = await generateAiReply({
      siteName: conversation.website.name,
      messages,
      knowledge,
      systemPrompt: aiConfig.systemPrompt || undefined,
      visitorContext,
      dbConfig,
      plan: conversation.website.plan as PlanType,
      websiteId: params.websiteDbId,
      conversationId: params.conversationId,
    })

    const content = reply?.trim()
    if (!content) return

    await sendBotReply(params, content, siteName)
  } catch {
    console.error('[AI auto-reply] failed for conversation', params.conversationId)
  }
}
