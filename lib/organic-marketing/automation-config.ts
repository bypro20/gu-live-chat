import { prisma } from '@/lib/db'
import { getSupportEmail } from '@/lib/site-config'

export type OrganicAutomationConfig = {
  enabled: boolean
  autoPublishBlog: boolean
  blogIntervalDays: number
  autoDispatchSocial: boolean
  webhookUrl: string
  notifyEmail: string
  lastBlogPublishedAt: string | null
  lastRunAt: string | null
  lastRunSummary: string | null
  runCount: number
}

const CONFIG_KEY = 'organic_marketing_automation'

const DEFAULTS: OrganicAutomationConfig = {
  enabled: true,
  autoPublishBlog: true,
  blogIntervalDays: 2,
  autoDispatchSocial: true,
  webhookUrl: process.env.ORGANIC_MARKETING_WEBHOOK_URL?.trim() || '',
  notifyEmail: process.env.ORGANIC_MARKETING_NOTIFY_EMAIL?.trim() || getSupportEmail(),
  lastBlogPublishedAt: null,
  lastRunAt: null,
  lastRunSummary: null,
  runCount: 0,
}

export async function getOrganicAutomationConfig(): Promise<OrganicAutomationConfig> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: CONFIG_KEY } })
    if (row?.value) {
      return { ...DEFAULTS, ...JSON.parse(row.value) }
    }
  } catch (e) {
    console.warn('[organic-automation] config parse failed:', e)
  }
  return { ...DEFAULTS }
}

export async function saveOrganicAutomationConfig(
  patch: Partial<OrganicAutomationConfig>
): Promise<OrganicAutomationConfig> {
  const current = await getOrganicAutomationConfig()
  const next = { ...current, ...patch }
  await prisma.platformSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })
  return next
}

export async function recordAutomationRun(summary: string): Promise<void> {
  const current = await getOrganicAutomationConfig()
  await saveOrganicAutomationConfig({
    lastRunAt: new Date().toISOString(),
    lastRunSummary: summary,
    runCount: current.runCount + 1,
  })
}
