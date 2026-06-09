import { prisma } from '@/lib/db'
import { hasAnyPlatformAiKey, pickDefaultProvider } from './provider'
import { DEFAULT_MODEL } from './models'

/** Platform AI anahtarı varsa ve site config yoksa varsayılanı oluşturur. */
export async function ensureAiConfig(websiteDbId: string) {
  if (!hasAnyPlatformAiKey()) return null

  const existing = await prisma.aIConfig.findUnique({ where: { websiteId: websiteDbId } })
  if (existing) return existing

  const provider = pickDefaultProvider() ?? 'OPENAI'
  return prisma.aIConfig.create({
    data: {
      websiteId: websiteDbId,
      isActive: true,
      autoReply: true,
      autoSuggest: true,
      provider,
      model: DEFAULT_MODEL[provider],
      apiKey: '',
      temperature: 0.75,
      systemPrompt: '',
    },
  })
}
