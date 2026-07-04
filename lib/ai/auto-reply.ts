import { prisma } from '../db'
import { emitBotMessage, emitBotTyping, emitVisitorMessagesRead } from '../socket-events'
import { generateAiReply, isAiLlmAvailable, fallbackReply, type ChatMessage } from './provider'
import { loadRelevantKnowledge, loadKnowledge, toChatMessages } from './knowledge'
import { getAiFeatureFlags } from './feature-flags'
import { describeImageUrl } from './vision'
import { loadVisitorContext } from './visitor-context'
import { isChatbotWaitingForInput } from '../chatbot-runner'
import { deliverChannelReply } from '../channels/deliver-reply'
import { websiteHasAiAssistant } from '../plan-features'
import { resolveEffectivePlan, websiteHasUnlimitedAccess } from '../platform-admin-server'
import { matchFaqFromKnowledge } from './faq-matcher'
import { ensureAiConfig } from './ensure-config'
import { ensureMarketingSiteAiReady, buildMarketingSystemPrompt, getMarketingKnowledgeCache } from '../marketing-ai-setup'
import { MARKETING_WIDGET_DISPLAY_NAME } from '../marketing-demo-agents'
import { isPlatformMarketingWebsiteId } from '../marketing-website'
import { resolveWidgetAgentIdentity } from '../widget-bot-identity'
import { loadWebsiteAgentFields } from '../website-agent-fields'
import { PLATFORM_AI_MODEL } from './platform-config'
import { resolveVisitorReplyLanguage } from './reply-language'
import type { PlanType } from '../constants'

const HISTORY_LIMIT = 12
const MARKETING_HISTORY_LIMIT = 8
const KNOWLEDGE_LIMIT = 6
const WIDGET_MAX_TOKENS = 420
const MARKETING_MAX_TOKENS = 380
let marketingAiReadyPromise: Promise<void> | null = null

async function ensureMarketingAiBeforeReply(
  websiteDbId: string,
  websitePublicId: string
): Promise<void> {
  if (!(await isPlatformMarketingWebsiteId(websitePublicId))) return

  const ready = await prisma.aIConfig.findUnique({
    where: { websiteId: websiteDbId },
    select: { isActive: true, autoReply: true },
  })
  if (ready?.isActive && ready.autoReply) return

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

function buildMarketingFallbackContent(
  botDisplayName: string,
  userMessage: string,
  knowledge: ReturnType<typeof getMarketingKnowledgeCache>
): string {
  const messages: ChatMessage[] = userMessage
    ? [{ role: 'user', content: userMessage }]
    : []
  return fallbackReply(botDisplayName, messages, knowledge, MARKETING_WIDGET_DISPLAY_NAME)
}

async function clearMarketingChatbotBlock(conversationId: string): Promise<void> {
  await prisma.conversation.updateMany({
    where: { id: conversationId, chatbotCompleted: false },
    data: { chatbotCompleted: true, chatbotHandedToAi: true },
  })
}

/** Marketing widget — Gemini başarısız olsa bile ziyaretçiye yanıt garantisi. */
export async function sendMarketingFallbackReply(
  params: AutoReplyParams,
  userMessage = '',
): Promise<void> {
  const website = await prisma.website.findUnique({
    where: { id: params.websiteDbId },
    select: { name: true, avatarUrl: true },
  })
  const agentFields = await loadWebsiteAgentFields(params.websiteDbId)
  const botIdentity = resolveWidgetAgentIdentity({
    websiteName: website?.name || 'Destek',
    agentDisplayName: agentFields.agentDisplayName,
    agentTitle: agentFields.agentTitle,
    avatarUrl: website?.avatarUrl,
    isMarketing: true,
  })

  const content = buildMarketingFallbackContent(
    botIdentity.replyName,
    userMessage,
    getMarketingKnowledgeCache()
  )

  await sendBotReply(params, content, botIdentity.replyName, botIdentity.avatarUrl)
}

export async function ensureMarketingWidgetReply(
  params: AutoReplyParams,
  since?: Date,
): Promise<boolean> {
  await maybeRunAiAutoReply(params)

  const botMessage = await prisma.message.findFirst({
    where: {
      conversationId: params.conversationId,
      senderType: 'BOT',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (botMessage) return true

  const lastVisitor = await prisma.message.findFirst({
    where: { conversationId: params.conversationId, senderType: 'VISITOR' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  })

  await sendMarketingFallbackReply(params, lastVisitor?.content?.trim() || '')
  return true
}

/**
 * Hibrit AI Agent: önce bilgi bankası SSS eşleşmesi, sonra LLM.
 * Temsilci atanmadığı sürece standart talepleri otomatik yanıtlar.
 */
export async function maybeRunAiAutoReply(params: AutoReplyParams): Promise<void> {
  const isMarketing = await isPlatformMarketingWebsiteId(params.websitePublicId)
  let botDisplayName = 'Asistan'

  try {
    if (!isMarketing) {
      const waiting = await isChatbotWaitingForInput(params.conversationId)
      if (waiting) return
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      select: {
        id: true,
        assignedToId: true,
        chatbotCompleted: true,
        chatbotHandedToAi: true,
        chatbotId: true,
        visitorId: true,
        visitorLang: true,
        website: { select: { id: true, name: true, plan: true, avatarUrl: true } },
      },
    })

    if (!conversation) return
    if (conversation.assignedToId) return

    if (isMarketing) {
      await ensureMarketingAiBeforeReply(params.websiteDbId, params.websitePublicId)
      await clearMarketingChatbotBlock(params.conversationId)
    } else {
      const hasAi =
        (await websiteHasUnlimitedAccess(params.websiteDbId)) ||
        (await websiteHasAiAssistant(params.websiteDbId, conversation.website.plan))
      if (!hasAi) return

      await ensureMarketingAiBeforeReply(params.websiteDbId, params.websitePublicId)

      if (conversation.chatbotId && !conversation.chatbotCompleted && !conversation.chatbotHandedToAi) {
        return
      }
    }

    let aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: params.websiteDbId },
    })
    if (!aiConfig) {
      aiConfig = await ensureAiConfig(params.websiteDbId)
    }

    if (!isMarketing && (!aiConfig || !aiConfig.isActive || !aiConfig.autoReply)) return

    if (isMarketing && (!aiConfig || !aiConfig.isActive || !aiConfig.autoReply)) {
      await ensureMarketingSiteAiReady(params.websiteDbId)
      aiConfig =
        (await prisma.aIConfig.findUnique({ where: { websiteId: params.websiteDbId } })) ?? aiConfig
    }

    const recent = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'desc' },
      take: isMarketing ? MARKETING_HISTORY_LIMIT : HISTORY_LIMIT,
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

    let knowledgeForReply
    if (isMarketing) {
      knowledgeForReply = getMarketingKnowledgeCache()
    } else {
      knowledgeForReply = await loadRelevantKnowledge(params.websiteDbId, last.content, KNOWLEDGE_LIMIT)
      if (knowledgeForReply.length === 0) {
        const all = await loadKnowledge(params.websiteDbId)
        knowledgeForReply = all.slice(0, KNOWLEDGE_LIMIT)
      }
    }
    const siteName = (conversation.website.name || 'Destek').trim()
    const agentFields = await loadWebsiteAgentFields(conversation.website.id)
    const botIdentity = resolveWidgetAgentIdentity({
      websiteName: siteName,
      agentDisplayName: agentFields.agentDisplayName,
      agentTitle: agentFields.agentTitle,
      avatarUrl: conversation.website.avatarUrl,
      isMarketing,
    })
    botDisplayName = botIdentity.replyName
    const botAvatar = botIdentity.avatarUrl

    if (!isMarketing) {
      emitBotTyping({
        conversationId: params.conversationId,
        agentName: botDisplayName,
        start: true,
      })
    }

    const readIds = isMarketing ? [] : await markVisitorMessagesRead(params.conversationId)
    if (readIds.length > 0) {
      emitVisitorMessagesRead({ conversationId: params.conversationId, messageIds: readIds })
    }

    const dbConfig = isMarketing
      ? {
          provider: 'GEMINI' as const,
          model: PLATFORM_AI_MODEL,
          apiKey: '',
          temperature: 0.82,
        }
      : {
          provider: aiConfig!.provider,
          model: aiConfig!.model,
          apiKey: aiConfig!.apiKey,
          temperature: aiConfig!.temperature,
        }
    const llmReady = isAiLlmAvailable(dbConfig)
    let replied = false

    try {
      if (!llmReady) {
        const faqHit = matchFaqFromKnowledge(last.content, knowledgeForReply)
        if (faqHit && faqHit.confidence >= 0.5) {
          await sendBotReply(params, faqHit.answer, botDisplayName, botAvatar)
          replied = true
          return
        }
        if (isMarketing) {
          const fallback = buildMarketingFallbackContent(botDisplayName, last.content, knowledgeForReply)
          await sendBotReply(params, fallback, botDisplayName, botAvatar)
          replied = true
          return
        }
      }

      const messages = toChatMessages(ordered)
      if (messages.length === 0) {
        if (isMarketing) {
          const fallback = buildMarketingFallbackContent(botDisplayName, last.content, knowledgeForReply)
          await sendBotReply(params, fallback, botDisplayName, botAvatar)
        }
        return
      }

      const visitorContext = isMarketing
        ? undefined
        : await loadVisitorContext(
            params.visitorId || conversation.visitorId,
            params.conversationId
          )

      let visionContext = ''
      if (!isMarketing && flags.multimodalEnabled) {
        const image = last.attachments?.find((a) => a.mimeType?.startsWith('image/') && a.url)
        if (image?.url) {
          const desc = await describeImageUrl(image.url, last.content)
          if (desc) visionContext = `Ziyaretçi görseli: ${desc}`
        }
      }

      const replyLanguage = resolveVisitorReplyLanguage({
        visitorLang: conversation.visitorLang,
        lastUserMessage: last.content,
        fallback: 'tr',
      })

      const reply = await generateAiReply({
        siteName: isMarketing ? botDisplayName : conversation.website.name,
        messages,
        knowledge: knowledgeForReply,
        systemPrompt: isMarketing
          ? buildMarketingSystemPrompt(agentFields.agentDisplayName, replyLanguage)
          : aiConfig?.systemPrompt || undefined,
        visitorContext: [visitorContext, visionContext].filter(Boolean).join('\n\n') || undefined,
        webSearchEnabled: isMarketing ? false : flags.webSearchEnabled,
        smartRoutingEnabled: isMarketing ? false : flags.smartRoutingEnabled,
        dbConfig,
        plan: (await resolveEffectivePlan(
          params.websiteDbId,
          conversation.website.plan as PlanType
        )) as PlanType,
        websiteId: params.websiteDbId,
        conversationId: params.conversationId,
        maxTokens: isMarketing ? MARKETING_MAX_TOKENS : WIDGET_MAX_TOKENS,
        brandName: isMarketing ? MARKETING_WIDGET_DISPLAY_NAME : undefined,
        replyLanguage,
      })

      const content = reply?.trim()
      if (!content) {
        if (isMarketing) {
          const fallback = buildMarketingFallbackContent(botDisplayName, last.content, knowledgeForReply)
          await sendBotReply(params, fallback, botDisplayName, botAvatar)
          replied = true
        }
        return
      }

      await sendBotReply(params, content, botDisplayName, botAvatar)
      replied = true
    } finally {
      if (!isMarketing) {
        emitBotTyping({
          conversationId: params.conversationId,
          agentName: botDisplayName,
          start: false,
        })
      }
    }

    if (isMarketing && !replied) {
      const fallback = buildMarketingFallbackContent(botDisplayName, last.content, knowledgeForReply)
      await sendBotReply(params, fallback, botDisplayName, botAvatar)
    }
  } catch (err) {
    console.error('[AI auto-reply] failed for conversation', params.conversationId, err)
    if (!isMarketing) {
      emitBotTyping({
        conversationId: params.conversationId,
        agentName: botDisplayName,
        start: false,
      })
      return
    }

    try {
      const lastVisitor = await prisma.message.findFirst({
        where: { conversationId: params.conversationId, senderType: 'VISITOR' },
        orderBy: { createdAt: 'desc' },
        select: { content: true },
      })
      await sendMarketingFallbackReply(params, lastVisitor?.content?.trim() || '')
    } catch (fallbackErr) {
      console.error('[AI auto-reply] marketing fallback failed:', fallbackErr)
    }
  }
}
