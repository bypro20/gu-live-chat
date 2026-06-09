import type { SendMessageInput } from '@/lib/validators/message'

export function buildMessageCreateData(validated: SendMessageInput, sender: {
  senderType: 'AGENT' | 'VISITOR'
  senderId?: string | null
  conversationId: string
}) {
  const content =
    validated.content.trim() ||
    (validated.attachment
      ? validated.type === 'IMAGE'
        ? `🖼️ ${validated.attachment.fileName}`
        : `📎 ${validated.attachment.fileName}`
      : '')

  return {
    conversationId: sender.conversationId,
    content,
    type: validated.type,
    senderType: sender.senderType,
    senderId: sender.senderId ?? null,
    status: 'SENT' as const,
    ...(validated.attachment
      ? {
          attachments: {
            create: {
              url: validated.attachment.url,
              fileName: validated.attachment.fileName,
              fileSize: validated.attachment.fileSize ?? null,
              mimeType: validated.attachment.mimeType ?? null,
            },
          },
        }
      : {}),
  }
}
