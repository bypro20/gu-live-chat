import { prisma } from './db'
import { emitBotMessage } from './socket-events'
import { generateAiReply, fallbackReply, type ChatMessage } from './ai/provider'
import { PLATFORM_AI_MODEL } from './ai/platform-config'
import { buildMarketingSystemPrompt, getMarketingKnowledgeCache } from './marketing-ai-setup'
import { isPlatformMarketingWebsiteId } from './marketing-website'
import { resolveWidgetAgentIdentity } from './widget-bot-identity'
import { loadWebsiteAgentFields } from './website-agent-fields'
import { toChatMessages } from './ai/knowledge'
import { MARKETING_WIDGET_DISPLAY_NAME } from './marketing-demo-agents'

const MARKETING_HISTORY_LIMIT = 8
const MARKETING_MAX_TOKENS = 700
const LLM_TIMEOUT_MS = 9000

export type MarketingWidgetReplyResult = {
  id: string
  content: string
  senderName: string
  senderImage: string | null
  createdAt: string
}

type ReplyParams = {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId: string
  visitorMessage: string
  since: Date
}

function buildInstantReply(agentName: string, userMessage: string): string {
  const knowledge = getMarketingKnowledgeCache()
  const messages: ChatMessage[] = userMessage
    ? [{ role: 'user', content: userMessage }]
    : []
  return fallbackReply(agentName, messages, knowledge, MARKETING_WIDGET_DISPLAY_NAME)
}

async function loadAgentIdentity(websiteDbId: string) {
  const website = await prisma.website.findUnique({
    where: { id: websiteDbId },
    select: { name: true, avatarUrl: true },
  })
  const agentFields = await loadWebsiteAgentFields(websiteDbId)
  return resolveWidgetAgentIdentity({
    websiteName: website?.name || 'Destek',
    agentDisplayName: agentFields.agentDisplayName,
    agentTitle: agentFields.agentTitle,
    avatarUrl: website?.avatarUrl,
    isMarketing: true,
  })
}

async function persistBotReply(
  params: ReplyParams,
  content: string,
  senderName: string,
  senderImage: string | null,
): Promise<MarketingWidgetReplyResult> {
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
      chatbotCompleted: true,
      chatbotHandedToAi: true,
    },
  })

  emitBotMessage({
    conversationId: params.conversationId,
    websiteId: params.websitePublicId,
    message: {
      id: botMessage.id,
      content: botMessage.content,
      senderName,
      senderImage,
      createdAt: botMessage.createdAt,
    },
  })

  return {
    id: botMessage.id,
    content: botMessage.content,
    senderName,
    senderImage,
    createdAt: botMessage.createdAt.toISOString(),
  }
}

async function generateMarketingLlmReply(
  params: ReplyParams,
  agentDisplayName: string | null | undefined,
  botDisplayName: string,
): Promise<string | null> {
  const recent = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: 'desc' },
    take: MARKETING_HISTORY_LIMIT,
    select: { content: true, senderType: true },
  })
  const messages = toChatMessages(recent.reverse())
  if (messages.length === 0) return null

  const knowledge = getMarketingKnowledgeCache()
  const llmPromise = generateAiReply({
    siteName: botDisplayName,
    messages,
    knowledge,
    systemPrompt: buildMarketingSystemPrompt(agentDisplayName),
    webSearchEnabled: false,
    smartRoutingEnabled: false,
    dbConfig: {
      provider: 'GEMINI',
      model: PLATFORM_AI_MODEL,
      apiKey: '',
      temperature: 0.82,
    },
    plan: 'BUSINESS',
    websiteId: params.websiteDbId,
    conversationId: params.conversationId,
    maxTokens: MARKETING_MAX_TOKENS,
    brandName: MARKETING_WIDGET_DISPLAY_NAME,
  })

  const timed = await Promise.race([
    llmPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), LLM_TIMEOUT_MS)),
  ])

  const text = typeof timed === 'string' ? timed.trim() : ''
  return text || null
}

/** Marketing widget — hızlı, garantili, insan gibi yanıt. */
export async function runMarketingWidgetReply(
  params: ReplyParams,
): Promise<MarketingWidgetReplyResult> {
  const isMarketing = await isPlatformMarketingWebsiteId(params.websitePublicId)
  if (!isMarketing) {
    throw new Error('Not a marketing website')
  }

  const existing = await prisma.message.findFirst({
    where: {
      conversationId: params.conversationId,
      senderType: 'BOT',
      createdAt: { gte: params.since },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (existing?.content?.trim()) {
    const identity = await loadAgentIdentity(params.websiteDbId)
    return {
      id: existing.id,
      content: existing.content,
      senderName: identity.replyName,
      senderImage: identity.avatarUrl,
      createdAt: existing.createdAt.toISOString(),
    }
  }

  const identity = await loadAgentIdentity(params.websiteDbId)
  const instant = buildInstantReply(identity.replyName, params.visitorMessage)

  let content = instant
  try {
    const llm = await generateMarketingLlmReply(
      params,
      (await loadWebsiteAgentFields(params.websiteDbId)).agentDisplayName,
      identity.replyName,
    )
    if (llm) content = llm
  } catch (err) {
    console.warn('[marketing-widget-reply] LLM skipped, using instant reply:', err)
  }

  return persistBotReply(params, content, identity.replyName, identity.avatarUrl)
}

export { buildMarketingWelcomeReply } from './marketing-demo-agents'
