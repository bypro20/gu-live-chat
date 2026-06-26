// LinkedIn Messaging / webhook integration (Community Management API)

export interface LinkedInConfig {
  accessToken: string
  organizationId: string
  webhookSecret?: string
}

export interface LinkedInInboundMessage {
  senderId: string
  messageId: string
  text: string
  timestamp: number
}

export function parseLinkedInWebhook(body: unknown): LinkedInInboundMessage | null {
  try {
    const payload = body as {
      senderId?: string
      sender?: { id?: string; member?: string }
      messageId?: string
      id?: string
      text?: string
      message?: { text?: string; body?: string }
      body?: string
      timestamp?: number
      elements?: Array<{
        from?: { member?: string; id?: string }
        message?: { text?: string; body?: string }
      }>
    }

    if (payload.elements?.length) {
      for (const el of payload.elements) {
        const senderId = el.from?.member || el.from?.id
        const text = el.message?.text || el.message?.body
        if (senderId && text?.trim()) {
          return {
            senderId,
            messageId: payload.messageId || payload.id || `li_${Date.now()}`,
            text: text.trim(),
            timestamp: payload.timestamp || Date.now(),
          }
        }
      }
    }

    const senderId = payload.senderId || payload.sender?.member || payload.sender?.id
    const text = payload.text || payload.message?.text || payload.message?.body || payload.body
    if (!senderId || !text?.trim()) return null
    return {
      senderId,
      messageId: payload.messageId || payload.id || `li_${Date.now()}`,
      text: text.trim(),
      timestamp: payload.timestamp || Date.now(),
    }
  } catch {
    return null
  }
}

export async function sendLinkedInMessage(
  config: LinkedInConfig,
  recipientId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipientUrn = recipientId.startsWith('urn:')
      ? recipientId
      : `urn:li:person:${recipientId}`

    const res = await fetch('https://api.linkedin.com/v2/messages?action=create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        recipients: [recipientUrn],
        subject: 'Mesaj',
        body: text,
        'message-type': 'MEMBER_TO_MEMBER',
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: err.slice(0, 200) || `HTTP ${res.status}` }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
