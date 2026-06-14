export interface TelegramConfig {
  botToken: string
  botUsername?: string
  /** setWebhook secret_token — X-Telegram-Bot-Api-Secret-Token header */
  webhookSecret?: string
}

export async function sendTelegramMessage(
  cfg: TelegramConfig,
  chatId: string,
  text: string
): Promise<boolean> {
  if (!cfg.botToken || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    const data = await res.json()
    return !!data.ok
  } catch (err) {
    console.error('[Telegram] send failed:', err)
    return false
  }
}
