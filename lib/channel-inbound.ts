import { prisma } from './db'
import { emitVisitorMessage } from './socket-events'
import { processChatbotOnVisitorMessage } from './chatbot-runner'
import { maybeRunAiAutoReply } from './ai/auto-reply'
import { analyzeSentiment } from './ai/sentiment'
import { resolveAgentsOnline } from './agents-online'

export interface InboundChannelMessage {
  websiteDbId: string
  websitePublicId: string
  fingerprint: string
  visitorName?: string
  content: string
  messageType?: 'TEXT' | 'FILE'
}

/** Create visitor, conversation, message and trigger automations for channel webhooks. */
export async function handleInboundChannelMessage(
  msg: InboundChannelMessage
): Promise<{ conversationId: string; messageId: string }> {
  const { websiteDbId, websitePublicId, fingerprint, visitorName, content } = msg
  const messageType = msg.messageType || 'TEXT'

  let visitor = await prisma.visitor.findUnique({
    where: { websiteId_fingerprint: { websiteId: websiteDbId, fingerprint } },
  })

  if (!visitor) {
    visitor = await prisma.visitor.create({
      data: {
        websiteId: websiteDbId,
        fingerprint,
        name: visitorName || fingerprint,
      },
    })
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      visitorId: visitor.id,
      websiteId: websiteDbId,
      status: { in: ['OPEN', 'PENDING'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  let isNewConversation = false
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        websiteId: websiteDbId,
        visitorId: visitor.id,
        status: 'OPEN',
        source: 'WIDGET',
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
      },
    })
    isNewConversation = true
  }

  const sentiment = analyzeSentiment(content)

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      type: messageType,
      senderType: 'VISITOR',
      status: 'SENT',
      sentiment,
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: content.substring(0, 100),
      unreadCount: { increment: 1 },
    },
  })

  emitVisitorMessage({
    conversationId: conversation.id,
    websiteId: websitePublicId,
    message: {
      id: message.id,
      content: message.content,
      type: message.type,
      visitorId: visitor.id,
      createdAt: message.createdAt,
    },
    isNewConversation,
  })

  const priorConversations = await prisma.conversation.count({
    where: { visitorId: visitor.id, websiteId: websiteDbId },
  })

  const agentsOnline = await resolveAgentsOnline(websitePublicId, websiteDbId)

  await processChatbotOnVisitorMessage({
    websiteDbId,
    websitePublicId,
    conversationId: conversation.id,
    visitorId: visitor.id,
    messageContent: content,
    isFirstVisit: isNewConversation || priorConversations <= 1,
    agentsOnline,
  })

  await maybeRunAiAutoReply({
    websiteDbId,
    websitePublicId,
    conversationId: conversation.id,
    visitorId: visitor.id,
  })

  return { conversationId: conversation.id, messageId: message.id }
}
