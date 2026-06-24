import { runPaidMarketingAutomation } from './auto-runner'
import type { PaidAutoRunnerReport } from './auto-runner'

export async function runPaidMarketingBot(): Promise<PaidAutoRunnerReport> {
  try {
    return await runPaidMarketingAutomation()
  } catch (e) {
    console.error('[paid-marketing-bot]', e)
    return {
      ok: false,
      at: new Date().toISOString(),
      enabled: true,
      tasksToday: 0,
      emailSent: false,
      copyRefreshed: false,
      adsLaunched: 0,
      summary: e instanceof Error ? e.message : 'Bot hatası',
    }
  }
}
