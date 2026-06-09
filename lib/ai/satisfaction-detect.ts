import { prisma } from '../db'

const SATISFACTION_RE =
  /\b(teşekkür|tesekkur|sağol|sagol|tamam|oldu|çözüldü|cozuldu|harika|süper|super|thanks|thank you|ok|great|perfect|sorun yok)\b/i

export function isSatisfactionMessage(text: string): boolean {
  const t = text.trim()
  if (t.length > 120) return false
  return SATISFACTION_RE.test(t)
}

/**
 * Ziyaretçi memnuniyet ifadesi + AI/bot yanıtı varsa sohbeti otomatik çözüldü işaretle.
 */
export async function maybeAutoResolveOnSatisfaction(
  conversationId: string,
  visitorContent: string
): Promise<boolean> {
  if (!isSatisfactionMessage(visitorContent)) return false

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      status: true,
      assignedToId: true,
      messages: {
        where: { senderType: { in: ['BOT', 'AGENT'] } },
        select: { id: true, senderType: true },
        take: 1,
      },
    },
  })

  if (!conversation) return false
  if (conversation.assignedToId) return false
  if (conversation.status === 'RESOLVED' || conversation.status === 'CLOSED') return false
  if (conversation.messages.length === 0) return false

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'RESOLVED', closedAt: new Date() },
  })

  return true
}
