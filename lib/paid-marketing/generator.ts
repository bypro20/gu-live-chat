import { parseAiJson, askMarketingAi, isOrganicAiAvailable } from '@/lib/organic-marketing/ai'
import { buildGuLiveChatProductBrief } from '@/lib/organic-marketing/product-brief'
import { buildSeedPaidPlan } from './seed-plan'
import { savePaidMarketingPlan } from './storage'
import type { AdCampaignTask, PaidMarketingPlan } from './types'

export { isOrganicAiAvailable as isPaidAiAvailable }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function datesFromToday(count: number) {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    out.push(x.toISOString().slice(0, 10))
  }
  return out
}

export async function generatePaidMarketingPlan(forceSeed = false): Promise<PaidMarketingPlan> {
  if (forceSeed || !isOrganicAiAvailable()) {
    const seed = buildSeedPaidPlan()
    await savePaidMarketingPlan(seed)
    return seed
  }

  const brief = buildGuLiveChatProductBrief()
  const seed = buildSeedPaidPlan()

  const raw = await askMarketingAi(
    'Sen Gu Live Chat için ücretli reklam stratejisti sin. Google Ads, Meta ve LinkedIn kampanyaları üret.',
    `${brief}

Mevcut kampanya şablonu (referans):
${JSON.stringify(seed.campaigns.slice(0, 3), null, 2)}

7 günlük reklam takvimi üret. JSON şeması:
{
  "calendar": [
    {
      "channel": "google_search|meta_feed|meta_retarget|linkedin",
      "audienceId": "pa-1",
      "campaignName": "string",
      "objective": "string",
      "dailyBudgetTry": 80,
      "landingUrl": "https://www.gulivechat.com/basla?utm_...",
      "creative": {
        "headlines": ["max 30 karakter", "..."],
        "descriptions": ["max 90 karakter", "..."],
        "primaryText": "Meta için uzun metin",
        "callToAction": "Ücretsiz Başla"
      },
      "keywords": { "matchType": "phrase", "keywords": ["..."], "negativeKeywords": ["..."] },
      "targetingNotes": "hedef kitle notları",
      "tip": "panelde ne yapılacak",
      "status": "ready"
    }
  ]
}

Kurallar:
- Türkçe metin, Gu Live Chat markası
- Google başlıkları max 30 karakter
- Günlük 1 görev, 7 gün, farklı kanallar dönüşümlü
- Bütçe 60-200 TL/gün arası gerçekçi
- landingUrl UTM içermeli`
  )

  const parsed = parseAiJson<{ calendar: Omit<AdCampaignTask, 'id' | 'date'>[] }>(raw)
  if (!parsed?.calendar?.length) {
    await savePaidMarketingPlan(seed)
    return seed
  }

  const dates = datesFromToday(7)
  const calendar: AdCampaignTask[] = parsed.calendar.slice(0, 7).map((task, i) => ({
    ...task,
    id: `ad-${dates[i]}-${task.channel}`,
    date: dates[i] ?? todayIso(),
    status: task.status ?? 'ready',
  }))

  const plan: PaidMarketingPlan = {
    ...seed,
    updatedAt: new Date().toISOString(),
    calendar,
  }

  await savePaidMarketingPlan(plan)
  return plan
}

export async function refreshTodayAdCopy(): Promise<AdCampaignTask | null> {
  if (!isOrganicAiAvailable()) return null

  const { getPaidMarketingPlan, savePaidMarketingPlan } = await import('./storage')
  const plan = await getPaidMarketingPlan()
  if (!plan) return null

  const today = todayIso()
  const task = plan.calendar.find((t) => t.date === today && t.status !== 'launched')
  if (!task) return null

  const brief = buildGuLiveChatProductBrief()
  const raw = await askMarketingAi(
    'Reklam metni uzmanısın. Mevcut kampanya için yeni varyant üret.',
    `${brief}

Kampanya: ${task.campaignName}
Kanal: ${task.channel}
Hedef: ${task.objective}

JSON:
{
  "creative": {
    "headlines": ["..."],
    "descriptions": ["..."],
    "primaryText": "...",
    "callToAction": "..."
  },
  "tip": "bugünkü optimizasyon önerisi"
}`
  )

  const parsed = parseAiJson<{ creative: AdCampaignTask['creative']; tip: string }>(raw)
  if (!parsed?.creative) return null

  task.creative = parsed.creative
  if (parsed.tip) task.tip = parsed.tip
  plan.updatedAt = new Date().toISOString()
  await savePaidMarketingPlan(plan)
  return task
}

export function getTodayAdTasks(plan: PaidMarketingPlan): AdCampaignTask[] {
  const today = todayIso()
  return plan.calendar.filter((t) => t.date === today && t.status !== 'skipped')
}
