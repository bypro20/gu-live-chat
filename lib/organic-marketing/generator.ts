import { buildGuLiveChatProductBrief } from './product-brief'
import { askMarketingAi, isOrganicAiAvailable, parseAiJson } from './ai'
import { buildSeedOrganicPlan } from './seed-strategy'
import { getOrganicMarketingPlan, saveOrganicMarketingPlan } from './storage'
import type {
  ContentTask,
  GenerateStrategyResult,
  MarketingChannel,
  OrganicMarketingPlan,
  OrganicStrategy,
  TargetAudience,
} from './types'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type AiAudiencesPayload = { audiences: TargetAudience[] }
type AiStrategiesPayload = { strategies: OrganicStrategy[] }
type AiCalendarPayload = { tasks: Omit<ContentTask, 'id' | 'generatedAt' | 'status'>[] }

export async function generateOrganicStrategy(options?: {
  forceSeed?: boolean
}): Promise<GenerateStrategyResult> {
  const brief = buildGuLiveChatProductBrief()

  if (options?.forceSeed || !isOrganicAiAvailable()) {
    const plan = buildSeedOrganicPlan()
    await saveOrganicMarketingPlan(plan)
    return {
      plan,
      aiUsed: false,
      message: options?.forceSeed
        ? 'Hazır strateji yüklendi.'
        : 'AI anahtarı yok — hazır Gu Live Chat stratejisi kullanıldı.',
    }
  }

  try {
    const audiencesRaw = await askMarketingAi(
      'Sen B2B SaaS organik pazarlama stratejistisin. JSON şema: { "audiences": [{ "id", "name", "description", "painPoints": string[], "channels": ("blog"|"instagram"|"linkedin"|"tiktok"|"x")[], "keywords": string[] }] }',
      `${brief}\n\nGu Live Chat için 4 hedef kitle (ICP) tanımla. id alanı "aud-1" formatında olsun. Türkçe yaz.`
    )

    const audiencesParsed = parseAiJson<AiAudiencesPayload>(audiencesRaw)
    const audiences = audiencesParsed?.audiences?.length
      ? audiencesParsed.audiences.map((a, i) => ({
          ...a,
          id: a.id || `aud-${i + 1}`,
          channels: [...(a.channels?.length ? a.channels : (['blog', 'linkedin'] as MarketingChannel[]))],
        }))
      : buildSeedOrganicPlan().audiences

    const strategiesRaw = await askMarketingAi(
      'Sen organik büyüme uzmanısın. JSON şema: { "strategies": [{ "id", "audienceId", "title", "tactics": string[], "contentIdeas": string[], "postingFrequency", "kpis": string[] }] }',
      `${brief}\n\nHedef kitleler:\n${JSON.stringify(audiences, null, 0)}\n\nHer kitle için 1 organik strateji üret. audienceId eşleşmeli. Türkçe.`
    )

    const strategiesParsed = parseAiJson<AiStrategiesPayload>(strategiesRaw)
    const strategies = strategiesParsed?.strategies?.length
      ? strategiesParsed.strategies.map((s, i) => ({
          ...s,
          id: s.id || `str-${i + 1}`,
        }))
      : buildSeedOrganicPlan().strategies.filter((s) =>
          audiences.some((a) => a.id === s.audienceId)
        )

    const calendar = await generateWeekCalendarWithAi(audiences, strategies, brief)

    const plan: OrganicMarketingPlan = {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: 'ai',
      productBrief: brief,
      audiences,
      strategies,
      calendar,
    }

    await saveOrganicMarketingPlan(plan)
    return { plan, aiUsed: true, message: 'AI ile hedef kitle ve strateji üretildi.' }
  } catch (e) {
    console.error('[organic-marketing] generate failed:', e)
    const plan = buildSeedOrganicPlan()
    await saveOrganicMarketingPlan(plan)
    return {
      plan,
      aiUsed: false,
      message: 'AI hatası — hazır strateji yüklendi.',
    }
  }
}

export async function regenerateWeekCalendar(): Promise<OrganicMarketingPlan> {
  const existing = await getOrganicMarketingPlan()
  const brief = existing.productBrief || buildGuLiveChatProductBrief()

  const calendar = isOrganicAiAvailable()
    ? await generateWeekCalendarWithAi(existing.audiences, existing.strategies, brief)
    : buildSeedOrganicPlan().calendar

  const plan: OrganicMarketingPlan = {
    ...existing,
    calendar,
    generatedAt: new Date().toISOString(),
  }

  await saveOrganicMarketingPlan(plan)
  return plan
}

async function generateWeekCalendarWithAi(
  audiences: TargetAudience[],
  strategies: OrganicStrategy[],
  brief: string
): Promise<ContentTask[]> {
  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const calendarRaw = await askMarketingAi(
    'Sen sosyal medya içerik planlayıcısısın. JSON şema: { "tasks": [{ "date", "channel", "type", "title", "hook", "body", "cta", "hashtags"?: string[], "landingUrl"?: string, "audienceId"?: string }] }',
    `${brief}\n\nTarihler: ${dates.join(', ')}\nKitleler: ${JSON.stringify(audiences.map((a) => ({ id: a.id, name: a.name })))}\nStratejiler: ${JSON.stringify(strategies.map((s) => ({ audienceId: s.audienceId, title: s.title })))}\n\n7 günlük organik içerik takvimi üret. Her gün farklı kanal (blog, instagram, linkedin, tiktok, x karışık). Türkçe, Gu Live Chat markası. UTM: utm_source={kanal}&utm_medium=organic`
  )

  const parsed = parseAiJson<AiCalendarPayload>(calendarRaw)
  const now = new Date().toISOString()

  if (parsed?.tasks?.length) {
    return parsed.tasks.slice(0, 7).map((t, i) => ({
      id: uid('task'),
      date: t.date || dates[i] || dates[0],
      channel: t.channel || 'blog',
      type: t.type || 'post',
      title: t.title || 'Gu Live Chat',
      hook: t.hook || '',
      body: t.body || '',
      cta: t.cta || 'gulivechat.com/basla',
      hashtags: t.hashtags,
      landingUrl: t.landingUrl,
      status: 'draft' as const,
      audienceId: t.audienceId,
      generatedAt: now,
    }))
  }

  return buildSeedOrganicPlan().calendar
}

export async function appendDailyContentTask(): Promise<ContentTask | null> {
  const plan = await getOrganicMarketingPlan()
  const today = new Date().toISOString().slice(0, 10)

  const existingToday = plan.calendar.filter((t) => t.date === today && t.status !== 'skipped')
  if (existingToday.length >= 2) return null

  const brief = plan.productBrief || buildGuLiveChatProductBrief()
  const audience = plan.audiences[existingToday.length % plan.audiences.length]
  const strategy = plan.strategies.find((s) => s.audienceId === audience?.id)

  let task: ContentTask

  if (isOrganicAiAvailable() && audience) {
    const raw = await askMarketingAi(
      'Tek günlük organik içerik görevi üret. JSON: { "tasks": [{ "date", "channel", "type", "title", "hook", "body", "cta", "hashtags"?: string[], "landingUrl"?: string }] }',
      `${brief}\n\nTarih: ${today}\nKitle: ${audience.name}\nStrateji: ${strategy?.title ?? ''}\n\n1 adet içerik görevi.`
    )
    const parsed = parseAiJson<AiCalendarPayload>(raw)
    const tpl = parsed?.tasks?.[0]

    task = {
      id: uid('task'),
      date: today,
      channel: tpl?.channel ?? (['blog', 'instagram', 'linkedin'] as const)[existingToday.length % 3],
      type: tpl?.type ?? 'post',
      title: tpl?.title ?? `Gu Live Chat — ${audience.name}`,
      hook: tpl?.hook ?? strategy?.contentIdeas[0] ?? '',
      body: tpl?.body ?? strategy?.tactics[0] ?? '',
      cta: tpl?.cta ?? 'gulivechat.com/basla',
      hashtags: tpl?.hashtags,
      landingUrl: tpl?.landingUrl,
      status: 'draft',
      audienceId: audience.id,
      generatedAt: new Date().toISOString(),
    }
  } else {
    const seed = buildSeedOrganicPlan().calendar[existingToday.length % 7]
    if (!seed) return null
    task = { ...seed, id: uid('task'), date: today, generatedAt: new Date().toISOString(), status: 'draft' }
  }

  plan.calendar.unshift(task)
  plan.calendar = plan.calendar.slice(0, 60)
  await saveOrganicMarketingPlan(plan)
  return task
}
