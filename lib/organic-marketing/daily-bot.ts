import { runOrganicMarketingAutomation } from './auto-runner'
import type { AutoRunnerReport } from './auto-runner'

export type OrganicMarketingBotReport = AutoRunnerReport

export async function runOrganicMarketingBot(): Promise<OrganicMarketingBotReport> {
  try {
    return await runOrganicMarketingAutomation()
  } catch (e) {
    console.error('[organic-marketing-bot]', e)
    return {
      ok: false,
      at: new Date().toISOString(),
      enabled: true,
      social: [],
      tasksCreated: 0,
      summary: e instanceof Error ? e.message : 'Bot hatası',
    }
  }
}
