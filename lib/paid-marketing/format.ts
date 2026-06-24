import type { AdCampaignTask } from './types'

const CHANNEL_LABELS: Record<string, string> = {
  google_search: 'Google Ads (Arama)',
  meta_feed: 'Meta Ads (Feed)',
  meta_retarget: 'Meta Retargeting',
  linkedin: 'LinkedIn Ads',
}

export function formatAdTaskForCopy(task: AdCampaignTask): string {
  const lines = [
    `📢 ${CHANNEL_LABELS[task.channel] ?? task.channel}`,
    `Kampanya: ${task.campaignName}`,
    `Hedef: ${task.objective}`,
    `Günlük bütçe: ₺${task.dailyBudgetTry}`,
    `Landing: ${task.landingUrl}`,
    '',
    '— Başlıklar —',
    ...task.creative.headlines.map((h, i) => `${i + 1}. ${h}`),
  ]

  if (task.creative.descriptions.length) {
    lines.push('', '— Açıklamalar —', ...task.creative.descriptions.map((d, i) => `${i + 1}. ${d}`))
  }

  if (task.creative.primaryText) {
    lines.push('', '— Ana metin (Meta/LinkedIn) —', task.creative.primaryText)
  }

  lines.push('', `CTA: ${task.creative.callToAction}`)

  if (task.keywords?.keywords.length) {
    lines.push('', '— Anahtar kelimeler —', task.keywords.keywords.join(', '))
    if (task.keywords.negativeKeywords.length) {
      lines.push('', '— Negatif —', task.keywords.negativeKeywords.join(', '))
    }
  }

  lines.push('', `Hedefleme: ${task.targetingNotes}`, '', `💡 ${task.tip}`)
  return lines.join('\n')
}

export function exportGoogleAdsKeywordsCsv(tasks: AdCampaignTask[]): string {
  const rows = ['Campaign,Keyword,Match Type,Max CPC (TRY)']
  for (const task of tasks) {
    if (!task.keywords) continue
    for (const kw of task.keywords.keywords) {
      rows.push(`"${task.campaignName}","${kw}","${task.keywords.matchType}",""`)
    }
  }
  return rows.join('\n')
}
