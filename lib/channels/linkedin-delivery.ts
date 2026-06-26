import { prisma } from '../db'
import { sendLinkedInMessage, type LinkedInConfig } from './linkedin'

export async function getLinkedInConfig(websiteDbId: string): Promise<LinkedInConfig | null> {
  const integration = await prisma.channelIntegration.findFirst({
    where: { websiteId: websiteDbId, type: 'LINKEDIN' as never, isActive: true },
    select: { config: true },
  })
  if (!integration?.config) return null
  try {
    const cfg = JSON.parse(integration.config) as LinkedInConfig
    if (cfg.accessToken && cfg.organizationId) return cfg
  } catch { /* ignore */ }
  return null
}

export async function deliverLinkedInReply(conversationId: string, text: string): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        websiteId: true,
        visitor: { select: { fingerprint: true } },
      },
    })
    if (!conversation?.visitor.fingerprint.startsWith('li_')) return

    const recipient = conversation.visitor.fingerprint.slice(3)
    if (!recipient) return

    const cfg = await getLinkedInConfig(conversation.websiteId)
    if (!cfg) return

    await sendLinkedInMessage(cfg, recipient, text)
  } catch (err) {
    console.error('[LinkedIn delivery]', err)
  }
}
