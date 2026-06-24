import { prisma } from '@/lib/db'
import { buildSeedPaidPlan } from './seed-plan'
import type { AdCampaignTask, PaidMarketingPlan } from './types'

const PLAN_KEY = 'paid_marketing_plan'

export async function getPaidMarketingPlan(): Promise<PaidMarketingPlan | null> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: PLAN_KEY } })
    if (row?.value) {
      return JSON.parse(row.value) as PaidMarketingPlan
    }
  } catch (e) {
    console.warn('[paid-marketing] plan parse failed:', e)
  }
  return null
}

export async function savePaidMarketingPlan(plan: PaidMarketingPlan): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key: PLAN_KEY },
    create: { key: PLAN_KEY, value: JSON.stringify(plan) },
    update: { value: JSON.stringify(plan) },
  })
}

export async function ensurePaidPlanInitialized(): Promise<PaidMarketingPlan> {
  const existing = await getPaidMarketingPlan()
  if (existing?.calendar?.length) return existing

  const seed = buildSeedPaidPlan()
  await savePaidMarketingPlan(seed)
  return seed
}

export async function updateAdTask(
  taskId: string,
  patch: Partial<Pick<AdCampaignTask, 'status' | 'creative' | 'dailyBudgetTry' | 'tip'>>
): Promise<PaidMarketingPlan | null> {
  const plan = await getPaidMarketingPlan()
  if (!plan) return null

  const task = plan.calendar.find((t) => t.id === taskId)
  if (!task) return null

  Object.assign(task, patch)
  plan.updatedAt = new Date().toISOString()
  await savePaidMarketingPlan(plan)
  return plan
}
