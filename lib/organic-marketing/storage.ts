import { prisma } from '@/lib/db'
import type { ContentTask, OrganicMarketingPlan } from './types'
import { buildSeedOrganicPlan } from './seed-strategy'

const PLAN_KEY = 'organic_marketing_plan'
const CRON_KEY = 'organic_marketing_last_cron'

export async function getOrganicMarketingPlan(): Promise<OrganicMarketingPlan> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: PLAN_KEY } })
    if (row?.value) {
      const parsed = JSON.parse(row.value) as OrganicMarketingPlan
      if (parsed?.audiences?.length && parsed?.strategies?.length) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('[organic-marketing] plan parse failed:', e)
  }
  return buildSeedOrganicPlan()
}

export async function saveOrganicMarketingPlan(plan: OrganicMarketingPlan): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key: PLAN_KEY },
    create: { key: PLAN_KEY, value: JSON.stringify(plan) },
    update: { value: JSON.stringify(plan) },
  })
}

export async function updateContentTask(
  taskId: string,
  patch: Partial<Pick<ContentTask, 'status' | 'title' | 'hook' | 'body' | 'cta'>>
): Promise<ContentTask | null> {
  const plan = await getOrganicMarketingPlan()
  const idx = plan.calendar.findIndex((t) => t.id === taskId)
  if (idx < 0) return null

  plan.calendar[idx] = { ...plan.calendar[idx], ...patch }
  await saveOrganicMarketingPlan(plan)
  return plan.calendar[idx]
}

export async function getLastCronRun(): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key: CRON_KEY } })
  return row?.value ?? null
}

export async function setLastCronRun(iso: string): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key: CRON_KEY },
    create: { key: CRON_KEY, value: iso },
    update: { value: iso },
  })
}

export async function ensureOrganicPlanInitialized(): Promise<OrganicMarketingPlan> {
  const plan = await getOrganicMarketingPlan()
  if (plan.source === 'seed') {
    const row = await prisma.platformSetting.findUnique({ where: { key: PLAN_KEY } })
    if (!row) {
      await saveOrganicMarketingPlan(plan)
    }
  }
  return plan
}
