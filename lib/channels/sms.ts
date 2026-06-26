export interface SmsConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  webhookSecret?: string
}

export interface SmsInboundMessage {
  from: string
  text: string
  messageSid: string
}

export function parseTwilioSmsPayload(data: Record<string, string>): SmsInboundMessage | null {
  const from = data.From?.trim()
  const text = data.Body?.trim()
  if (!from || !text) return null
  return {
    from,
    text,
    messageSid: data.MessageSid || `sms_${Date.now()}`,
  }
}

export async function sendSmsMessage(
  config: SmsConfig,
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
    const params = new URLSearchParams({
      To: to,
      From: config.phoneNumber,
      Body: body.slice(0, 1600),
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15000),
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
