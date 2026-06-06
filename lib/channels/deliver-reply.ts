import { deliverWhatsAppReply } from './whatsapp-delivery'
import { deliverTelegramReply } from './telegram-delivery'
import { deliverMetaReply } from './meta-delivery'

/** Route agent/bot reply to the visitor's channel when applicable. */
export async function deliverChannelReply(
  conversationId: string,
  text: string
): Promise<void> {
  await Promise.all([
    deliverWhatsAppReply(conversationId, text),
    deliverTelegramReply(conversationId, text),
    deliverMetaReply(conversationId, text, 'MESSENGER'),
    deliverMetaReply(conversationId, text, 'INSTAGRAM'),
  ])
}
