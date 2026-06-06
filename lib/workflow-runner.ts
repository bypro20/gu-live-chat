import { prisma } from './db'
import { emitBotMessage } from './socket-events'
import { notifyWebsiteMembers } from './notifications'
import { dispatchWebhooks } from './webhook-dispatcher'
import { runChatbotForNewConversation } from './chatbot-runner'

export type WorkflowTrigger =
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_RESOLVED'
  | 'CONVERSATION_CLOSED'
  | 'MESSAGE_RECEIVED'

interface WorkflowContext {
  websiteDbId: string
  websitePublicId: string
  conversationId: string
  visitorId?: string
  messageContent?: string
  senderType?: string
}

export async function runWorkflows(trigger: WorkflowTrigger, ctx: WorkflowContext) {
  const workflows = await prisma.workflow.findMany({
    where: {
      websiteId: ctx.websiteDbId,
      isActive: true,
      triggerType: trigger,
    },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  for (const workflow of workflows) {
    for (const step of workflow.steps) {
      await executeWorkflowStep(step, ctx)
    }
  }
}

async function executeWorkflowStep(
  step: { actionType: string; config: string | null; delayMs: number | null },
  ctx: WorkflowContext
) {
  if (step.delayMs && step.delayMs > 0) {
    // Serverless-safe: skip long delays; short delays acceptable for local/socket server
    if (step.delayMs > 5000) return
    await new Promise((r) => setTimeout(r, step.delayMs!))
  }

  let config: Record<string, unknown> = {}
  if (step.config) {
    try {
      config = JSON.parse(step.config)
    } catch { /* ignore */ }
  }

  switch (step.actionType) {
    case 'SEND_MESSAGE': {
      const content = (config.message as string) || (config.content as string)
      if (!content?.trim()) break
      const message = await prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          content,
          type: 'TEXT',
          senderType: 'BOT',
          status: 'SENT',
        },
      })
      emitBotMessage({
        conversationId: ctx.conversationId,
        websiteId: ctx.websitePublicId,
        message: {
          id: message.id,
          content: message.content,
          senderName: 'Otomasyon',
          createdAt: message.createdAt,
        },
      })
      break
    }
    case 'ASSIGN_AGENT': {
      const userId = config.userId as string | undefined
      const member = userId
        ? await prisma.teamMember.findFirst({
            where: { websiteId: ctx.websiteDbId, userId },
          })
        : await prisma.teamMember.findFirst({
            where: { websiteId: ctx.websiteDbId, role: 'OWNER' },
          })
      if (member) {
        await prisma.conversation.update({
          where: { id: ctx.conversationId },
          data: { assignedToId: member.userId },
        })
      }
      break
    }
    case 'CHANGE_STATUS': {
      const status = (config.status as string) || 'RESOLVED'
      await prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: {
          status: status as 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED',
          closedAt: ['CLOSED', 'RESOLVED'].includes(status) ? new Date() : undefined,
        },
      })
      break
    }
    case 'ADD_TAG': {
      const tagName = (config.tagName as string) || (config.name as string)
      if (!tagName) break
      let tag = await prisma.tag.findFirst({
        where: { websiteId: ctx.websiteDbId, name: tagName },
      })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { websiteId: ctx.websiteDbId, name: tagName, color: '#1972F5' },
        })
      }
      await prisma.conversationTag.upsert({
        where: {
          conversationId_tagId: {
            conversationId: ctx.conversationId,
            tagId: tag.id,
          },
        },
        create: { conversationId: ctx.conversationId, tagId: tag.id },
        update: {},
      })
      break
    }
    case 'SEND_NOTIFICATION': {
      const title = (config.title as string) || 'Otomasyon bildirimi'
      const message = (config.message as string) || 'Bir iş akışı tetiklendi'
      await notifyWebsiteMembers({
        websiteId: ctx.websiteDbId,
        type: 'NEW_MESSAGE',
        title,
        message,
        data: { conversationId: ctx.conversationId },
      })
      break
    }
    case 'FORWARD_TO_WEBHOOK': {
      await dispatchWebhooks(ctx.websiteDbId, 'message.received', {
        conversationId: ctx.conversationId,
        content: ctx.messageContent,
        senderType: ctx.senderType,
      })
      break
    }
    case 'TRIGGER_CHATBOT': {
      if (ctx.visitorId) {
        await runChatbotForNewConversation({
          websiteDbId: ctx.websiteDbId,
          websitePublicId: ctx.websitePublicId,
          conversationId: ctx.conversationId,
          visitorId: ctx.visitorId,
        })
      }
      break
    }
    case 'ADD_NOTE': {
      const content = (config.content as string) || (config.note as string)
      if (!content?.trim()) break
      const owner = await prisma.teamMember.findFirst({
        where: { websiteId: ctx.websiteDbId, role: 'OWNER' },
        select: { userId: true },
      })
      if (owner) {
        await prisma.note.create({
          data: {
            conversationId: ctx.conversationId,
            userId: owner.userId,
            content,
          },
        })
      }
      break
    }
    default:
      break
  }
}
