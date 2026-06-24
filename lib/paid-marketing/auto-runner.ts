import { syncProductionSchema } from '@/lib/db-schema-sync'
import { getPaidAutomationConfig, recordPaidAutomationRun } from './automation-config'
import { sendPaidMarketingDigest } from './dispatcher'
import { getTodayAdTasks, refreshTodayAdCopy } from './generator'
import { ensurePaidPlanInitialized } from './storage'
import type { AdCampaignTask } from './types'

export type PaidAutoRunnerReport = {
  ok: boolean
  at: string
  enabled: boolean
  tasksToday: number
  emailSent: boolean
  copyRefreshed: boolean
  summary: string
}

export async function runPaidMarketingAutomation(): Promise<PaidAutoRunnerReport> {
  const at = new Date().toISOString()

  await syncProductionSchema().catch(() => {})
  await ensurePaidPlanInitialized()

  const config = await getPaidAutomationConfig()
  if (!config.enabled) {
    return {
      ok: true,
      at,
      enabled: false,
      tasksToday: 0,
      emailSent: false,
      copyRefreshed: false,
      summary: 'Ücretli reklam otomasyonu kapalı',
    }
  }

  const plan = await ensurePaidPlanInitialized()
  let tasks: AdCampaignTask[] = getTodayAdTasks(plan)

  let copyRefreshed = false
  if (config.rotateChannels) {
    const refreshed = await refreshTodayAdCopy()
    if (refreshed) {
      copyRefreshed = true
      tasks = getTodayAdTasks(await ensurePaidPlanInitialized())
    }
  }

  let emailSent = false
  if (config.dailyEmailDigest && config.notifyEmail && tasks.length) {
    const email = await sendPaidMarketingDigest(tasks, config.notifyEmail)
    emailSent = email.ok
  }

  const parts = [
    tasks.length ? `${tasks.length} günlük kampanya` : 'Bugün kampanya yok',
    copyRefreshed ? 'metin yenilendi' : null,
    emailSent ? 'e-posta gönderildi' : null,
  ].filter(Boolean)

  const summary = parts.join(' · ') || 'Kontrol tamam'
  await recordPaidAutomationRun(summary)

  return {
    ok: true,
    at,
    enabled: true,
    tasksToday: tasks.length,
    emailSent,
    copyRefreshed,
    summary,
  }
}
