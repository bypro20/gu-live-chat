import { prisma } from '../db'
import { sendWhatsAppMessage, type WhatsAppConfig } from './whatsapp'

async function getWhatsAppConfig(websiteDbId: string): Promise<WhatsAppConfig | null> {
  const integration = await prisma.channelIntegration.findFirst({
    where: { websiteId: websiteDbId, type: 'WHATSAPP', isActive: true },
    select: { config: true },
  })
  if (!integration?.config) return null
  try {
    const cfg = JSON.parse(integration.config) as WhatsAppConfig
    if (cfg.accessToken && cfg.phoneNumberId) return cfg
  } catch { /* ignore */ }
  return null
}

/** Deliver a text reply to a WhatsApp visitor (fingerprint wa_{phone}). */
export async function deliverWhatsAppReply(
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
    if (!conversation?.visitor.fingerprint.startsWith('wa_')) return

    const phone = conversation.visitor.fingerprint.slice(3)
    if (!phone) return

    const cfg = await getWhatsAppConfig(conversation.websiteId)
    if (!cfg) return

    await sendWhatsAppMessage(cfg, phone, text)
  } catch (err) {
    console.error('[WhatsApp delivery]', err)
  }
}
