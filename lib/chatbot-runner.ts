import { prisma } from './db'
import { emitBotMessage } from './socket-events'
import { canPerformAction } from './subscription'

interface RunChatbotParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId: string
  messageContent?: string
  isFirstVisit?: boolean
  agentsOnline?: number
}

interface ChatbotStepRow {
  id: string
  type: string
  message: string | null
  options: string | null
  order: number
}

const INPUT_STEPS = new Set(['CHOICE', 'COLLECT_EMAIL', 'COLLECT_NAME'])

function parseOptions(options: string | null): Array<{ label: string; nextStepId?: string }> {
  if (!options) return []
  try {
    const parsed = JSON.parse(options) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((o) => {
      if (typeof o === 'string') return { label: o }
      const obj = o as { label?: string; nextStepId?: string }
      return { label: obj.label || '', nextStepId: obj.nextStepId }
    })
  } catch {
    return []
  }
}

function matchesKeywords(message: string, triggerValue: string | null): boolean {
  if (!triggerValue?.trim()) return false
  const lower = message.toLocaleLowerCase('tr-TR')
  return triggerValue
    .split(',')
    .map((k) => k.trim().toLocaleLowerCase('tr-TR'))
    .filter(Boolean)
    .some((kw) => lower.includes(kw))
}

function matchesTrigger(
  trigger: string,
  triggerValue: string | null,
  params: RunChatbotParams,
  message: string
): boolean {
  switch (trigger) {
    case 'ALL_CONVERSATIONS':
      return true
    case 'OFFLINE_ONLY':
      return (params.agentsOnline ?? 0) === 0
    case 'FIRST_VISIT':
      return params.isFirstVisit === true
    case 'KEYWORD':
      return matchesKeywords(message, triggerValue)
    default:
      return false
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function persistBotMessage(
  conversationId: string,
  websitePublicId: string,
  content: string,
  botName: string
) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      content,
      type: 'TEXT',
      senderType: 'BOT',
      status: 'SENT',
    },
  })
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: content.substring(0, 100),
    },
  })
  emitBotMessage({
    conversationId,
    websiteId: websitePublicId,
    message: {
      id: message.id,
      content: message.content,
      senderName: botName,
      createdAt: message.createdAt,
    },
  })
}

async function assignToOwner(websiteDbId: string, conversationId: string) {
  const owner = await prisma.teamMember.findFirst({
    where: { websiteId: websiteDbId, role: 'OWNER' },
    select: { userId: true },
  })
  if (owner) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: owner.userId },
    })
  }
}

async function completeChatbot(
  conversationId: string,
  handedToAi: boolean
) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      chatbotCompleted: true,
      chatbotHandedToAi: handedToAi,
    },
  })
}

async function executeStep(
  step: ChatbotStepRow,
  params: RunChatbotParams,
  botName: string
): Promise<'advance' | 'wait' | 'end' | 'assign'> {
  switch (step.type) {
    case 'MESSAGE': {
      if (step.message?.trim()) {
        await persistBotMessage(params.conversationId, params.websitePublicId, step.message, botName)
      }
      return 'advance'
    }
    case 'CHOICE': {
      const opts = parseOptions(step.options)
      const optionsText = opts
        .map((o, i) => `${i + 1}. ${o.label}`)
        .join('\n')
      const content = [step.message, optionsText].filter(Boolean).join('\n\n')
      if (content.trim()) {
        await persistBotMessage(params.conversationId, params.websitePublicId, content, botName)
      }
      return 'wait'
    }
    case 'COLLECT_EMAIL':
    case 'COLLECT_NAME': {
      if (step.message?.trim()) {
        await persistBotMessage(params.conversationId, params.websitePublicId, step.message, botName)
      }
      return 'wait'
    }
    case 'ASSIGN_AGENT': {
      if (step.message?.trim()) {
        await persistBotMessage(params.conversationId, params.websitePublicId, step.message, botName)
      }
      await assignToOwner(params.websiteDbId, params.conversationId)
      return 'assign'
    }
    case 'END':
      return 'end'
    default:
      return 'advance'
  }
}

async function runStepsFromIndex(
  steps: ChatbotStepRow[],
  startIndex: number,
  params: RunChatbotParams,
  botName: string
): Promise<{ waiting: boolean; completed: boolean }> {
  let index = startIndex

  while (index < steps.length) {
    const step = steps[index]
    const result = await executeStep(step, params, botName)

    if (result === 'wait') {
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: { chatbotStepIndex: index },
      })
      return { waiting: true, completed: false }
    }

    if (result === 'assign') {
      await completeChatbot(params.conversationId, false)
      return { waiting: false, completed: true }
    }

    if (result === 'end') {
      await completeChatbot(params.conversationId, true)
      return { waiting: false, completed: true }
    }

    index++
    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { chatbotStepIndex: index },
    })
  }

  await completeChatbot(params.conversationId, true)
  return { waiting: false, completed: true }
}

async function processVisitorInput(
  steps: ChatbotStepRow[],
  stepIndex: number,
  content: string,
  params: RunChatbotParams,
  botName: string
): Promise<{ ok: boolean; nextIndex: number }> {
  const step = steps[stepIndex]
  if (!step) return { ok: false, nextIndex: stepIndex }

  if (step.type === 'CHOICE') {
    const opts = parseOptions(step.options)
    const trimmed = content.trim()
    const num = parseInt(trimmed, 10)
    let matched = false
    if (!Number.isNaN(num) && num >= 1 && num <= opts.length) matched = true
    else {
      const lower = trimmed.toLocaleLowerCase('tr-TR')
      matched = opts.some((o) => o.label.toLocaleLowerCase('tr-TR').includes(lower) || lower.includes(o.label.toLocaleLowerCase('tr-TR')))
    }
    if (!matched) {
      await persistBotMessage(
        params.conversationId,
        params.websitePublicId,
        'Lütfen listeden bir seçenek belirtin (numara veya seçenek metni).',
        botName
      )
      return { ok: false, nextIndex: stepIndex }
    }
    return { ok: true, nextIndex: stepIndex + 1 }
  }

  if (step.type === 'COLLECT_EMAIL') {
    if (!isValidEmail(content)) {
      await persistBotMessage(
        params.conversationId,
        params.websitePublicId,
        'Geçerli bir e-posta adresi girin lütfen.',
        botName
      )
      return { ok: false, nextIndex: stepIndex }
    }
    await prisma.visitor.update({
      where: { id: params.visitorId },
      data: { email: content.trim() },
    })
    return { ok: true, nextIndex: stepIndex + 1 }
  }

  if (step.type === 'COLLECT_NAME') {
    const name = content.trim()
    if (name.length < 2) {
      await persistBotMessage(
        params.conversationId,
        params.websitePublicId,
        'Lütfen adınızı yazın.',
        botName
      )
      return { ok: false, nextIndex: stepIndex }
    }
    await prisma.visitor.update({
      where: { id: params.visitorId },
      data: { name },
    })
    return { ok: true, nextIndex: stepIndex + 1 }
  }

  return { ok: true, nextIndex: stepIndex + 1 }
}

async function startChatbot(
  chatbot: { id: string; name: string; steps: ChatbotStepRow[] },
  params: RunChatbotParams
) {
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      chatbotId: chatbot.id,
      chatbotStepIndex: 0,
      chatbotCompleted: false,
      chatbotHandedToAi: false,
    },
  })
  await runStepsFromIndex(chatbot.steps, 0, params, chatbot.name)
}

async function findMatchingChatbot(
  websiteDbId: string,
  params: RunChatbotParams,
  message: string,
  options: { allowKeyword: boolean; allowNewConvTriggers: boolean }
) {
  const chatbots = await prisma.chatbot.findMany({
    where: { websiteId: websiteDbId, isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  const candidates = chatbots.filter((bot) => {
    if (bot.trigger === 'KEYWORD') return options.allowKeyword
    return options.allowNewConvTriggers
  })

  // KEYWORD bots first, then FIRST_VISIT, OFFLINE, ALL
  const priority = ['KEYWORD', 'FIRST_VISIT', 'OFFLINE_ONLY', 'ALL_CONVERSATIONS']
  for (const trig of priority) {
    const match = candidates.find(
      (bot) =>
        bot.trigger === trig &&
        matchesTrigger(bot.trigger, bot.triggerValue, params, message) &&
        bot.steps.length > 0
    )
    if (match) return match
  }
  return null
}

/**
 * Main entry: call on every visitor message (widget, WhatsApp, etc.).
 * Returns whether the chatbot is waiting for user input (blocks AI auto-reply).
 */
export async function processChatbotOnVisitorMessage(
  params: RunChatbotParams
): Promise<{ waitingForInput: boolean }> {
  try {
    const website = await prisma.website.findUnique({
      where: { id: params.websiteDbId },
      select: { plan: true },
    })
    if (!website || !canPerformAction(website.plan, 'chatbot')) {
      return { waitingForInput: false }
    }

    const message = params.messageContent?.trim() || ''

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      select: {
        assignedToId: true,
        chatbotId: true,
        chatbotStepIndex: true,
        chatbotCompleted: true,
        chatbot: {
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })

    if (!conversation || conversation.assignedToId) {
      return { waitingForInput: false }
    }

    // Active flow — process visitor reply
    if (
      conversation.chatbotId &&
      conversation.chatbot &&
      !conversation.chatbotCompleted
    ) {
      const steps = conversation.chatbot.steps
      const current = steps[conversation.chatbotStepIndex]
      if (current && INPUT_STEPS.has(current.type) && message) {
        const { ok, nextIndex } = await processVisitorInput(
          steps,
          conversation.chatbotStepIndex,
          message,
          params,
          conversation.chatbot.name
        )
        if (!ok) return { waitingForInput: true }

        const result = await runStepsFromIndex(steps, nextIndex, params, conversation.chatbot.name)
        return { waitingForInput: result.waiting }
      }
      if (current && INPUT_STEPS.has(current.type)) {
        return { waitingForInput: true }
      }
    }

    // Start new flow: keyword on any message, or triggers on first interaction
    if (!conversation.chatbotId || conversation.chatbotCompleted) {
      const bot = await findMatchingChatbot(params.websiteDbId, params, message, {
        allowKeyword: message.length > 0,
        allowNewConvTriggers: !conversation.chatbotId,
      })
      if (bot) {
        const result = await startChatbot(bot, params)
        void result
        const updated = await prisma.conversation.findUnique({
          where: { id: params.conversationId },
          select: { chatbotCompleted: true, chatbotStepIndex: true, chatbot: { include: { steps: true } } },
        })
        if (updated?.chatbot && !updated.chatbotCompleted) {
          const step = updated.chatbot.steps[updated.chatbotStepIndex]
          if (step && INPUT_STEPS.has(step.type)) {
            return { waitingForInput: true }
          }
        }
      }
    }

    return { waitingForInput: false }
  } catch (err) {
    console.error('[Chatbot]', err)
    return { waitingForInput: false }
  }
}

/** @deprecated Use processChatbotOnVisitorMessage — kept for workflow compat */
export async function runChatbotForNewConversation(params: RunChatbotParams) {
  await processChatbotOnVisitorMessage({
    ...params,
    messageContent: params.messageContent || '',
  })
}

/** True when rule-based chatbot is mid-flow and AI should stay quiet. */
export async function isChatbotWaitingForInput(conversationId: string): Promise<boolean> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      chatbotCompleted: true,
      chatbotStepIndex: true,
      chatbot: { include: { steps: { orderBy: { order: 'asc' } } } },
    },
  })
  if (!conv?.chatbot || conv.chatbotCompleted) return false
  const step = conv.chatbot.steps[conv.chatbotStepIndex]
  return !!step && INPUT_STEPS.has(step.type)
}
