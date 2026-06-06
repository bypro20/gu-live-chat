import { prisma } from '../db'
import { sendMetaMessage, type MetaChannelConfig } from './meta'

async function getMetaConfig(
  websiteDbId: string,
  type: 'MESSENGER' | 'INSTAGRAM'
): Promise<MetaChannelConfig | null> {
  const integration = await prisma.channelIntegration.findFirst({
    where: { websiteId: websiteDbId, type, isActive: true },
    select: { config: true },
  })
  if (!integration?.config) return null
  try {
    return JSON.parse(integration.config) as MetaChannelConfig
  } catch {
    return null
  }
}

export async function deliverMetaReply(
  conversationId: string,
  text: string,
  channelType: 'MESSENGER' | 'INSTAGRAM'
): Promise<void> {
  try {
    const prefix = channelType === 'MESSENGER' ? 'fb_' : 'ig_'
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        websiteId: true,
        visitor: { select: { fingerprint: true } },
      },
    })
    if (!conversation?.visitor.fingerprint.startsWith(prefix)) return

    const recipientId = conversation.visitor.fingerprint.slice(prefix.length)
    if (!recipientId) return

    const cfg = await getMetaConfig(conversation.websiteId, channelType)
    const token = cfg?.pageAccessToken || cfg?.accessToken
    if (!token) return

    await sendMetaMessage(token, recipientId, text)
  } catch (err) {
    console.error(`[${channelType} delivery]`, err)
  }
}
