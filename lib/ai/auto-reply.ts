import { prisma } from '../db'
import { emitBotMessage, emitBotTyping, emitVisitorMessagesRead } from '../socket-events'
import { generateAiReply, isAiLlmAvailable } from './provider'
import { loadRelevantKnowledge, loadKnowledge, toChatMessages } from './knowledge'
import { getAiFeatureFlags } from './feature-flags'
import { describeImageUrl } from './vision'
import { loadVisitorContext } from './visitor-context'
import { isChatbotWaitingForInput } from '../chatbot-runner'
import { deliverChannelReply } from '../channels/deliver-reply'
import { websiteHasAiAssistant } from '../plan-features'
import { isAdminOwnedWebsite } from '../admin-website'
import { matchFaqFromKnowledge } from './faq-matcher'
import { ensureAiConfig } from './ensure-config'
import { ensureMarketingSiteAiReady } from '../marketing-ai-setup'
import { isPlatformMarketingWebsiteId } from '../marketing-website'
import { resolveWidgetAgentIdentity } from '../widget-bot-identity'
import { loadWebsiteAgentFields } from '../website-agent-fields'
import type { PlanType } from '../constants'

const HISTORY_LIMIT = 12
const KNOWLEDGE_LIMIT = 6
const WIDGET_MAX_TOKENS = 420
let marketingAiReadyPromise: Promise<void> | null = null

async function ensureMarketingAiBeforeReply(
  websiteDbId: string,
  websitePublicId: string
): Promise<void> {
  if (!(await isPlatformMarketingWebsiteId(websitePublicId))) return
  if (!marketingAiReadyPromise) {
    marketingAiReadyPromise = ensureMarketingSiteAiReady(websiteDbId).catch((e) => {
      marketingAiReadyPromise = null
      console.error('[AI auto-reply] marketing AI bootstrap failed:', e)
    })
  }
  await marketingAiReadyPromise
}

async function markVisitorMessagesRead(conversationId: string): Promise<string[]> {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderType: 'VISITOR',
      status: { in: ['SENT', 'DELIVERED'] },
    },
    data: { status: 'READ', readAt: new Date() },
  })
  const read = await prisma.message.findMany({
    where: { conversationId, senderType: 'VISITOR', status: 'READ' },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })
  return read.map((m) => m.id)
}

interface AutoReplyParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId?: string
}

async function sendBotReply(
  params: AutoReplyParams,
  content: string,
  siteName: string,
  senderImage?: string | null
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
      senderImage: senderImage ?? null,
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
        website: { select: { id: true, name: true, plan: true, avatarUrl: true } },
      },
    })

    if (!conversation) return
    if (conversation.assignedToId) return

    const hasAi =
      (await isAdminOwnedWebsite(params.websiteDbId)) ||
      (await websiteHasAiAssistant(params.websiteDbId, conversation.website.plan))
    if (!hasAi) return

    await ensureMarketingAiBeforeReply(params.websiteDbId, params.websitePublicId)

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
      select: {
        id: true,
        content: true,
        senderType: true,
        attachments: { select: { url: true, mimeType: true } },
      },
    })
    const ordered = recent.reverse()

    const last = ordered[ordered.length - 1]
    if (!last || last.senderType !== 'VISITOR') return

    const flags = await getAiFeatureFlags(params.websiteDbId)

    let knowledgeForReply = await loadRelevantKnowledge(params.websiteDbId, last.content, KNOWLEDGE_LIMIT)
    if (knowledgeForReply.length === 0) {
      const all = await loadKnowledge(params.websiteDbId)
      knowledgeForReply = all.slice(0, KNOWLEDGE_LIMIT)
    }
    const siteName = (conversation.website.name || 'Destek').trim()
    const isMarketing = await isPlatformMarketingWebsiteId(params.websitePublicId)
    const agentFields = await loadWebsiteAgentFields(conversation.website.id)
    const botIdentity = resolveWidgetAgentIdentity({
      websiteName: siteName,
      agentDisplayName: agentFields.agentDisplayName,
      agentTitle: agentFields.agentTitle,
      avatarUrl: conversation.website.avatarUrl,
      isMarketing,
    })
    const botDisplayName = botIdentity.replyName
    const botAvatar = botIdentity.avatarUrl

    emitBotTyping({
      conversationId: params.conversationId,
      agentName: botDisplayName,
      start: true,
    })

    const readIds = await markVisitorMessagesRead(params.conversationId)
    if (readIds.length > 0) {
      emitVisitorMessagesRead({ conversationId: params.conversationId, messageIds: readIds })
    }

    const dbConfig = {
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      temperature: aiConfig.temperature,
    }
    const llmReady = isAiLlmAvailable(dbConfig)

    try {
      // LLM varken kelime eşleşmesiyle aynı metni yapıştırma — model bilgi bankasından doğal yanıt üretsin
      if (!llmReady) {
        const faqHit = matchFaqFromKnowledge(last.content, knowledgeForReply)
        if (faqHit && faqHit.confidence >= 0.5) {
          await sendBotReply(params, faqHit.answer, botDisplayName, botAvatar)
          return
        }
      }

      const messages = toChatMessages(ordered)
      if (messages.length === 0) return

      const visitorContext = await loadVisitorContext(
        params.visitorId || conversation.visitorId,
        params.conversationId
      )

      let visionContext = ''
      if (flags.multimodalEnabled) {
        const image = last.attachments?.find((a) => a.mimeType?.startsWith('image/') && a.url)
        if (image?.url) {
          const desc = await describeImageUrl(image.url, last.content)
          if (desc) visionContext = `Ziyaretçi görseli: ${desc}`
        }
      }

      const reply = await generateAiReply({
        siteName: isMarketing ? botDisplayName : conversation.website.name,
        messages,
        knowledge: knowledgeForReply,
        systemPrompt: aiConfig.systemPrompt || undefined,
        visitorContext: [visitorContext, visionContext].filter(Boolean).join('\n\n') || undefined,
        webSearchEnabled: flags.webSearchEnabled,
        smartRoutingEnabled: flags.smartRoutingEnabled,
        dbConfig,
        plan: conversation.website.plan as PlanType,
        websiteId: params.websiteDbId,
        conversationId: params.conversationId,
        maxTokens: WIDGET_MAX_TOKENS,
      })

      const content = reply?.trim()
      if (!content) return

      await sendBotReply(params, content, botDisplayName, botAvatar)
    } finally {
      if (!isMarketing) {
        emitBotTyping({
          conversationId: params.conversationId,
          agentName: botDisplayName,
          start: false,
        })
      }
    }
  } catch {
    console.error('[AI auto-reply] failed for conversation', params.conversationId)
    if (!(await isPlatformMarketingWebsiteId(params.websitePublicId))) {
      emitBotTyping({
        conversationId: params.conversationId,
        agentName: 'Asistan',
        start: false,
      })
    }
  }
}
