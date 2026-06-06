import { prisma } from '../db'
import { emitBotMessage } from '../socket-events'
import { generateAiReply } from './provider'
import { loadKnowledge, toChatMessages } from './knowledge'

// Bot sender name uses the website name so it reads as the support team,
// not as a generic "AI assistant". Falls back to 'Destek' if name is empty.
const HISTORY_LIMIT = 12

interface AutoReplyParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
}

/**
 * Generates and persists an automatic AI bot reply for an incoming visitor
 * message — Crisp-style. Safeguards:
 *  - only replies when AIConfig.isActive && autoReply are enabled,
 *  - never replies once a human agent is assigned to the conversation,
 *  - only replies when the most recent message is from the visitor
 *    (prevents the bot from answering its own / an agent's message),
 *  - never throws (a failure here must not break visitor message sending).
 * The created Message is delivered to widget + admin through the existing
 * polling/socket flow (a new Message row is all that's required).
 */
export async function maybeRunAiAutoReply(params: AutoReplyParams): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      select: {
        id: true,
        assignedToId: true,
        website: { select: { id: true, name: true } },
      },
    })

    // No conversation, or a human agent has taken over → bot stays quiet.
    if (!conversation) return
    if (conversation.assignedToId) return

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: params.websiteDbId },
    })

    // Bot is "active" only when explicitly enabled for auto-reply.
    if (!aiConfig || !aiConfig.isActive || !aiConfig.autoReply) return

    const recent = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { content: true, senderType: true },
    })
    const ordered = recent.reverse()

    // Only respond to a fresh visitor message (loop / self-reply guard).
    const last = ordered[ordered.length - 1]
    if (!last || last.senderType !== 'VISITOR') return

    const messages = toChatMessages(ordered)
    if (messages.length === 0) return

    const knowledge = await loadKnowledge(params.websiteDbId)

    const reply = await generateAiReply({
      siteName: conversation.website.name,
      messages,
      knowledge,
      systemPrompt: aiConfig.systemPrompt || undefined,
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
  } catch {
    console.error('[AI auto-reply] failed for conversation', params.conversationId)
  }
}
