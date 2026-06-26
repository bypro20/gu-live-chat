import { prisma } from '../db'
import { sendSmsMessage, type SmsConfig } from './sms'

async function getSmsConfig(websiteDbId: string): Promise<SmsConfig | null> {
  const integration = await prisma.channelIntegration.findFirst({
    where: { websiteId: websiteDbId, type: 'SMS', isActive: true },
    select: { config: true },
  })
  if (!integration?.config) return null
  try {
    const cfg = JSON.parse(integration.config) as SmsConfig
    if (cfg.accountSid && cfg.authToken && cfg.phoneNumber) return cfg
  } catch {
    /* ignore */
  }
  return null
}

/** Deliver agent reply to SMS visitor (fingerprint sms_{phone}). */
export async function deliverSmsReply(conversationId: string, text: string): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        websiteId: true,
        visitor: { select: { fingerprint: true } },
      },
    })
    if (!conversation?.visitor.fingerprint.startsWith('sms_')) return

    const phone = conversation.visitor.fingerprint.slice(4)
    if (!phone) return

    const cfg = await getSmsConfig(conversation.websiteId)
    if (!cfg) return

    await sendSmsMessage(cfg, phone, text)
  } catch (err) {
    console.error('[SMS delivery]', err)
  }
}
