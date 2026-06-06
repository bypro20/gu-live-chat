import { prisma } from '../db'
import { sendTelegramMessage, type TelegramConfig } from './telegram'

async function getTelegramConfig(websiteDbId: string): Promise<TelegramConfig | null> {
  const integration = await prisma.channelIntegration.findFirst({
    where: { websiteId: websiteDbId, type: 'TELEGRAM', isActive: true },
    select: { config: true },
  })
  if (!integration?.config) return null
  try {
    const cfg = JSON.parse(integration.config) as TelegramConfig
    if (cfg.botToken) return cfg
  } catch { /* ignore */ }
  return null
}

/** Deliver agent reply to Telegram visitor (fingerprint tg_{chatId}). */
export async function deliverTelegramReply(
  conversationId: string,
  text: string
): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        websiteId: true,
        visitor: { select: { fingerprint: true } },
      },
    })
    if (!conversation?.visitor.fingerprint.startsWith('tg_')) return

    const chatId = conversation.visitor.fingerprint.slice(3)
    if (!chatId) return

    const cfg = await getTelegramConfig(conversation.websiteId)
    if (!cfg) return

    await sendTelegramMessage(cfg, chatId, text)
  } catch (err) {
    console.error('[Telegram delivery]', err)
  }
}
