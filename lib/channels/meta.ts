export interface MetaChannelConfig {
  pageId?: string
  pageAccessToken?: string
  businessAccountId?: string
  accessToken?: string
  verifyToken?: string
}

export async function sendMetaMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string
): Promise<boolean> {
  if (!pageAccessToken || !recipientId) return false
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    )
    const data = await res.json()
    return !data.error
  } catch (err) {
    console.error('[Meta] send failed:', err)
    return false
  }
}
