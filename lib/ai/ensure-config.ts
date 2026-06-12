import { prisma } from '@/lib/db'
import { hasAnyPlatformAiKey, pickDefaultProvider } from './provider'
import { getDefaultModelForPlan, getDefaultProviderForPlan } from './plan-models'
import type { PlanType } from '@/lib/constants'

/** Platform AI anahtarı varsa ve site config yoksa varsayılanı oluşturur. */
export async function ensureAiConfig(websiteDbId: string) {
  if (!hasAnyPlatformAiKey()) return null

  const existing = await prisma.aIConfig.findUnique({ where: { websiteId: websiteDbId } })
  if (existing) return existing

  const website = await prisma.website.findUnique({
    where: { id: websiteDbId },
    select: { plan: true },
  })
  const plan = (website?.plan ?? 'FREE') as PlanType
  const provider = pickDefaultProvider() ?? getDefaultProviderForPlan(plan)
  const model = getDefaultModelForPlan(plan, provider)
  return prisma.aIConfig.create({
    data: {
      websiteId: websiteDbId,
      isActive: true,
      autoReply: true,
      autoSuggest: true,
      provider,
      model,
      apiKey: '',
      temperature: 0.75,
      systemPrompt: '',
    },
  })
}
