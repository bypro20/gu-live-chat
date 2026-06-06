// ─── WhatsApp Business Cloud API ─────────────────────────────────────
// Uses Meta's WhatsApp Business Platform (Cloud API).
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Config stored in ChannelIntegration.config (JSON):
//   { accessToken, phoneNumberId, verifyToken, businessAccountId }

export interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  verifyToken: string
  businessAccountId?: string
}

export interface WhatsAppMessage {
  from: string          // Sender's phone number (E.164)
  id: string            // WhatsApp message ID
  text?: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'unknown'
  timestamp: number
  mediaId?: string
  mediaUrl?: string
  mimeType?: string
  fileName?: string
}

// ─── Parse incoming webhook payload ──────────────────────────────────

export function parseIncomingWebhook(body: unknown): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = []

  try {
    const payload = body as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              id: string
              from: string
              timestamp: string
              type: string
              text?: { body: string }
              image?: { id: string; mime_type: string }
              document?: { id: string; filename: string; mime_type: string }
              audio?: { id: string; mime_type: string }
              video?: { id: string; mime_type: string }
            }>
          }
        }>
      }>
    }

    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          const parsed: WhatsAppMessage = {
            from: msg.from,
            id: msg.id,
            type: 'unknown',
            timestamp: parseInt(msg.timestamp),
          }

          if (msg.type === 'text' && msg.text) {
            parsed.type = 'text'
            parsed.text = msg.text.body
          } else if (msg.type === 'image' && msg.image) {
            parsed.type = 'image'
            parsed.mediaId = msg.image.id
            parsed.mimeType = msg.image.mime_type
          } else if (msg.type === 'document' && msg.document) {
            parsed.type = 'document'
            parsed.mediaId = msg.document.id
            parsed.fileName = msg.document.filename
            parsed.mimeType = msg.document.mime_type
          } else if (msg.type === 'audio' && msg.audio) {
            parsed.type = 'audio'
            parsed.mediaId = msg.audio.id
            parsed.mimeType = msg.audio.mime_type
          } else if (msg.type === 'video' && msg.video) {
            parsed.type = 'video'
            parsed.mediaId = msg.video.id
            parsed.mimeType = msg.video.mime_type
          }

          messages.push(parsed)
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to parse webhook payload:', err)
  }

  return messages
}

// ─── Send text message ────────────────────────────────────────────────

export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('[WhatsApp] Send error:', data)
      return { success: false, error: data?.error?.message || 'API error' }
    }

    const messageId = data?.messages?.[0]?.id
    return { success: true, messageId }
  } catch (err) {
    console.error('[WhatsApp] Send failed:', err)
    return { success: false, error: 'Network error' }
  }
}

// ─── Mark message as read ─────────────────────────────────────────────

export async function markWhatsAppMessageRead(
  config: WhatsAppConfig,
  messageId: string
): Promise<void> {
  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    )
  } catch {
    // Non-critical — ignore
  }
}
