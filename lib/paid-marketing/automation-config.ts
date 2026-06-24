import { prisma } from '@/lib/db'
import { getSupportEmail } from '@/lib/site-config'

export type PaidAutomationConfig = {
  enabled: boolean
  dailyEmailDigest: boolean
  rotateChannels: boolean
  notifyEmail: string
  lastRunAt: string | null
  lastRunSummary: string | null
  runCount: number
}

const CONFIG_KEY = 'paid_marketing_automation'

const DEFAULTS: PaidAutomationConfig = {
  enabled: true,
  dailyEmailDigest: true,
  rotateChannels: true,
  notifyEmail: process.env.PAID_MARKETING_NOTIFY_EMAIL?.trim() || getSupportEmail(),
  lastRunAt: null,
  lastRunSummary: null,
  runCount: 0,
}

export async function getPaidAutomationConfig(): Promise<PaidAutomationConfig> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: CONFIG_KEY } })
    if (row?.value) {
      return { ...DEFAULTS, ...JSON.parse(row.value) }
    }
  } catch (e) {
    console.warn('[paid-automation] config parse failed:', e)
  }
  return { ...DEFAULTS }
}

export async function savePaidAutomationConfig(
  patch: Partial<PaidAutomationConfig>
): Promise<PaidAutomationConfig> {
  const current = await getPaidAutomationConfig()
  const next = { ...current, ...patch }
  await prisma.platformSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })
  return next
}

export async function recordPaidAutomationRun(summary: string): Promise<void> {
  const current = await getPaidAutomationConfig()
  await savePaidAutomationConfig({
    lastRunAt: new Date().toISOString(),
    lastRunSummary: summary,
    runCount: current.runCount + 1,
  })
}
