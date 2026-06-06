import { prisma } from './db'
import { emitBotMessage } from './socket-events'

interface RunChatbotParams {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId: string
  isFirstVisit?: boolean
  agentsOnline?: number
}

export async function runChatbotForNewConversation(params: RunChatbotParams) {
  const chatbots = await prisma.chatbot.findMany({
    where: { websiteId: params.websiteDbId, isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  if (chatbots.length === 0) return

  for (const chatbot of chatbots) {
    if (!shouldTriggerChatbot(chatbot.trigger, params)) continue

    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { chatbotId: chatbot.id },
    })

    for (const step of chatbot.steps) {
      await executeChatbotStep(step, params, chatbot.name)
      if (step.type === 'END') break
    }

    // Run first matching chatbot only
    break
  }
}

function shouldTriggerChatbot(
  trigger: string,
  params: RunChatbotParams
): boolean {
  switch (trigger) {
    case 'ALL_CONVERSATIONS':
      return true
    case 'OFFLINE_ONLY':
      return (params.agentsOnline ?? 0) === 0
    case 'FIRST_VISIT':
      return params.isFirstVisit === true
    default:
      return trigger === 'ALL_CONVERSATIONS'
  }
}

async function executeChatbotStep(
  step: {
    type: string
    message: string | null
    options: string | null
  },
  params: RunChatbotParams,
  botName: string
) {
  switch (step.type) {
    case 'MESSAGE': {
      if (!step.message?.trim()) return
      const message = await prisma.message.create({
        data: {
          conversationId: params.conversationId,
          content: step.message,
          type: 'TEXT',
          senderType: 'BOT',
          status: 'SENT',
        },
      })
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: step.message.substring(0, 100),
        },
      })
      emitBotMessage({
        conversationId: params.conversationId,
        websiteId: params.websitePublicId,
        message: {
          id: message.id,
          content: message.content,
          senderName: botName,
          createdAt: message.createdAt,
        },
      })
      break
    }
    case 'CHOICE': {
      let optionsText = ''
      if (step.options) {
        try {
          const opts = JSON.parse(step.options)
          if (Array.isArray(opts)) {
            optionsText = opts.map((o: string | { label?: string }, i: number) => {
              const label = typeof o === 'string' ? o : o.label || `Seçenek ${i + 1}`
              return `${i + 1}. ${label}`
            }).join('\n')
          }
        } catch { /* ignore */ }
      }
      const content = [step.message, optionsText].filter(Boolean).join('\n\n')
      if (!content.trim()) return
      const message = await prisma.message.create({
        data: {
          conversationId: params.conversationId,
          content,
          type: 'TEXT',
          senderType: 'BOT',
          status: 'SENT',
        },
      })
      emitBotMessage({
        conversationId: params.conversationId,
        websiteId: params.websitePublicId,
        message: {
          id: message.id,
          content: message.content,
          senderName: botName,
          createdAt: message.createdAt,
        },
      })
      break
    }
    case 'ASSIGN_AGENT': {
      const owner = await prisma.teamMember.findFirst({
        where: { websiteId: params.websiteDbId, role: 'OWNER' },
        select: { userId: true },
      })
      if (owner) {
        await prisma.conversation.update({
          where: { id: params.conversationId },
          data: { assignedToId: owner.userId },
        })
      }
      break
    }
    case 'COLLECT_EMAIL':
    case 'COLLECT_NAME':
      if (step.message?.trim()) {
        const message = await prisma.message.create({
          data: {
            conversationId: params.conversationId,
            content: step.message,
            type: 'TEXT',
            senderType: 'BOT',
            status: 'SENT',
          },
        })
        emitBotMessage({
          conversationId: params.conversationId,
          websiteId: params.websitePublicId,
          message: {
            id: message.id,
            content: message.content,
            senderName: botName,
            createdAt: message.createdAt,
          },
        })
      }
      break
    case 'END':
    default:
      break
  }
}
