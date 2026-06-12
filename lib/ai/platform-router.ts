import type { PlanType } from '@/lib/constants'
import type { AiProvider } from './provider'
import { DEFAULT_MODEL, findModelPreset, type AiModelTier } from './models'
import { clampModelToPlan } from './plan-models'

/** Seçilen sağlayıcı/model için Gemini üzerinden platform yedek eşlemesi. */
export function mapToGeminiModel(requested: AiProvider, model: string): string {
  const preset = findModelPreset(requested, model)
  const tier: AiModelTier = preset?.tier ?? 'economy'

  if (tier === 'premium') return 'gemini-2.5-pro'
  if (tier === 'standard') return 'gemini-2.5-flash'
  return 'gemini-2.5-flash-lite'
}

export function canUsePlatformFallback(requested: AiProvider, geminiKey?: string): boolean {
  if (!geminiKey?.trim()) return false
  // Ollama yerel sunucu gerektirir; anahtar yoksa Gemini ile karşılanır
  return true
}

export function buildGeminiFallbackRuntime(
  requested: AiProvider,
  model: string,
  geminiKey: string,
  temperature: number
) {
  return {
    provider: 'GEMINI' as const,
    apiKey: geminiKey,
    model: mapToGeminiModel(requested, model),
    temperature,
    source: 'env' as const,
    /** UI'da seçilen sağlayıcı — log/debug */
    requestedProvider: requested,
    requestedModel: model,
  }
}

export function clampRequestedForPlan(
  plan: PlanType | undefined,
  provider: AiProvider,
  model: string
): { provider: AiProvider; model: string } {
  if (!plan) return { provider, model }
  return clampModelToPlan(plan, provider, model)
}
