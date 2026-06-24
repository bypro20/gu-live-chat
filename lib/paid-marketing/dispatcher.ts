import { sendEmail, isEmailConfigured } from '@/lib/email'
import { getMailNotifyTo } from '@/lib/site-config'
import { formatAdTaskForCopy } from './format'
import type { AdCampaignTask } from './types'

const CHANNEL_LABELS: Record<string, string> = {
  google_search: 'Google Ads (Arama)',
  meta_feed: 'Meta Ads (Feed)',
  meta_retarget: 'Meta Retargeting',
  linkedin: 'LinkedIn Ads',
}

function formatTaskHtml(task: AdCampaignTask): string {
  const ch = CHANNEL_LABELS[task.channel] ?? task.channel
  let html = `
    <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
      <h3 style="margin:0 0 8px;color:#0f172a">${ch}: ${task.campaignName}</h3>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px">Bütçe: ₺${task.dailyBudgetTry}/gün · <a href="${task.landingUrl}">Landing URL</a></p>
      <p style="margin:0 0 12px;color:#334155"><strong>Başlıklar:</strong><br>${task.creative.headlines.map((h) => `• ${h}`).join('<br>')}</p>
  `

  if (task.creative.descriptions.length) {
    html += `<p style="margin:0 0 12px;color:#334155"><strong>Açıklamalar:</strong><br>${task.creative.descriptions.map((d) => `• ${d}`).join('<br>')}</p>`
  }

  if (task.creative.primaryText) {
    html += `<p style="margin:0 0 12px;color:#334155"><strong>Ana metin:</strong><br>${task.creative.primaryText.replace(/\n/g, '<br>')}</p>`
  }

  if (task.keywords?.keywords.length) {
    html += `<p style="margin:0 0 12px;color:#334155"><strong>Anahtar kelimeler:</strong> ${task.keywords.keywords.join(', ')}</p>`
  }

  html += `<p style="margin:0;color:#64748b;font-size:12px">💡 ${task.tip}</p></div>`
  return html
}

export async function sendPaidMarketingDigest(
  tasks: AdCampaignTask[],
  notifyEmail: string
): Promise<{ ok: boolean; error?: string }> {
  if (!tasks.length) return { ok: true }
  const notifyTo =
    getMailNotifyTo() || (notifyEmail.includes('@gulivechat.com') ? null : notifyEmail)
  if (!notifyTo || !isEmailConfigured()) {
    return { ok: false, error: 'E-posta yapılandırılmamış veya @gulivechat.com MX yok' }
  }

  const date = tasks[0]?.date ?? new Date().toISOString().slice(0, 10)
  const subject = `[Gu Live Chat] Günlük reklam planı — ${date}`
  const text = tasks.map(formatAdTaskForCopy).join('\n\n---\n\n')
  const html = `
    <h2>Günlük reklam planınız hazır</h2>
    <p>Panellere yapıştırıp yayına alın. Admin: <a href="https://www.gulivechat.com/admin/marketing/paid">Reklam Otomasyonu</a></p>
    ${tasks.map(formatTaskHtml).join('')}
  `

  const result = await sendEmail({ to: notifyTo, subject, html, text })
  return { ok: result.success, error: result.error }
}

export { formatAdTaskForCopy, exportGoogleAdsKeywordsCsv } from './format'
