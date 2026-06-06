import { prisma } from '../db'
import { emitBotMessage } from '../socket-events'
import { generateAiReply } from './provider'
import { loadKnowledge, toChatMessages } from './knowledge'
import { loadVisitorContext } from './visitor-context'
import { isChatbotWaitingForInput } from '../chatbot-runner'
import { deliverChannelReply } from '../channels/deliver-reply'
import { websiteHasAiAssistant } from '../plan-features'

const HISTORY_LIMIT = 12

interface AutoReplyParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId?: string
}

/**
 * Supsis-style hybrid AI: rule chatbot runs first; when flow completes or
 * hands off (END step), LLM auto-reply takes over if enabled.
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

    const hasAi = await websiteHasAiAssistant(
      params.websiteDbId,
      conversation.website.plan
    )
    if (!hasAi) return

    // Mid-rule-bot without handoff: AI stays quiet until flow ends.
    if (conversation.chatbotId && !conversation.chatbotCompleted && !conversation.chatbotHandedToAi) {
      return
    }

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: params.websiteDbId },
    })

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

    const messages = toChatMessages(ordered)
    if (messages.length === 0) return

    const knowledge = await loadKnowledge(params.websiteDbId)
    const visitorContext = await loadVisitorContext(params.visitorId || conversation.visitorId)

    const reply = await generateAiReply({
      siteName: conversation.website.name,
      messages,
      knowledge,
      systemPrompt: aiConfig.systemPrompt || undefined,
      visitorContext,
      dbConfig: {
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey,
        temperature: aiConfig.temperature,
      },
      websiteId: params.websiteDbId,
      conversationId: params.conversationId,
    })

    const content = reply?.trim()
    if (!content) return

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

    const senderName = (conversation.website.name || 'Destek').trim()
    emitBotMessage({
      conversationId: params.conversationId,
      websiteId: params.websitePublicId,
      message: {
        id: botMessage.id,
        content: botMessage.content,
        senderName,
        createdAt: botMessage.createdAt,
      },
    })

    await deliverChannelReply(params.conversationId, content)
  } catch {
    console.error('[AI auto-reply] failed for conversation', params.conversationId)
  }
}
