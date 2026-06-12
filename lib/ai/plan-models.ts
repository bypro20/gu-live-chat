import type { PlanType } from '@/lib/constants'
import type { Plan } from '@/app/generated/prisma/client'
import {
  DEFAULT_MODEL,
  MODEL_PRESETS,
  findModelPreset,
  modelTierRank,
  type AiModelTier,
  type ModelPreset,
} from './models'
import type { AiProvider } from './provider'

/** Paket fiyatına göre en yüksek model katmanı. */
export type PlanAiAccess = {
  maxTier: AiModelTier
  /** STARTER + eklenti = economy; PRO = standard; BUSINESS = premium */
  labelTr: string
  labelEn: string
}

export function getPlanAiAccess(plan: PlanType | Plan): PlanAiAccess {
  switch (plan) {
    case 'BUSINESS':
      return {
        maxTier: 'premium',
        labelTr: 'Tüm modeller (GPT-4o, Claude Opus, Gemini Pro)',
        labelEn: 'All models (GPT-4o, Claude Opus, Gemini Pro)',
      }
    case 'PRO':
      return {
        maxTier: 'standard',
        labelTr: 'GPT-4.1 mini, Claude Sonnet, Gemini Pro/Flash',
        labelEn: 'GPT-4.1 mini, Claude Sonnet, Gemini Pro/Flash',
      }
    case 'STARTER':
      return {
        maxTier: 'economy',
        labelTr: 'Groq, Gemini Flash, OpenRouter ücretsiz, Ollama',
        labelEn: 'Groq, Gemini Flash, OpenRouter free, Ollama',
      }
    default:
      return {
        maxTier: 'economy',
        labelTr: 'AI eklentisi gerekli',
        labelEn: 'AI add-on required',
      }
  }
}

/** STARTER paketi doğrudan AI içermez; eklenti ile economy katmanı açılır. */
export function effectiveAiPlan(plan: PlanType | Plan, hasAiFeature: boolean): PlanType | null {
  if (plan === 'FREE') return null
  if (plan === 'STARTER' && !hasAiFeature) return null
  if (plan === 'STARTER') return 'STARTER'
  return plan as PlanType
}

function tierAllowed(maxTier: AiModelTier, modelTier: AiModelTier): boolean {
  return modelTierRank(modelTier) <= modelTierRank(maxTier)
}

/** PRO/BUSINESS: OpenAI + Anthropic; STARTER+eklenti: sadece ekonomik sağlayıcılar. */
export function isProviderAllowedForPlan(plan: PlanType | Plan, provider: AiProvider): boolean {
  const access = getPlanAiAccess(plan)
  if (plan === 'STARTER') {
    return ['GROQ', 'OPENROUTER', 'GEMINI', 'OLLAMA'].includes(provider)
  }
  if (access.maxTier === 'economy') {
    return ['GROQ', 'OPENROUTER', 'GEMINI', 'OLLAMA'].includes(provider)
  }
  return true
}

export function isModelAllowedForPlan(
  plan: PlanType | Plan,
  provider: AiProvider,
  model: string
): boolean {
  if (!isProviderAllowedForPlan(plan, provider)) return false
  const preset = findModelPreset(provider, model)
  if (!preset) return false
  const { maxTier } = getPlanAiAccess(plan)
  return tierAllowed(maxTier, preset.tier)
}

export function getAllowedModelsForPlan(plan: PlanType | Plan): ModelPreset[] {
  const { maxTier } = getPlanAiAccess(plan)
  const out: ModelPreset[] = []
  for (const provider of Object.keys(MODEL_PRESETS) as AiProvider[]) {
    if (!isProviderAllowedForPlan(plan, provider)) continue
    for (const preset of MODEL_PRESETS[provider]) {
      if (tierAllowed(maxTier, preset.tier)) {
        out.push({ ...preset, label: `[${provider}] ${preset.label}` })
      }
    }
  }
  return out
}

export function getAllowedPresetsForProvider(
  plan: PlanType | Plan,
  provider: AiProvider
): ModelPreset[] {
  if (!isProviderAllowedForPlan(plan, provider)) return []
  const { maxTier } = getPlanAiAccess(plan)
  return MODEL_PRESETS[provider].filter((p) => tierAllowed(maxTier, p.tier))
}

export function getDefaultProviderForPlan(plan: PlanType | Plan): AiProvider {
  if (plan === 'PRO' || plan === 'BUSINESS') return 'OPENAI'
  if (isProviderAllowedForPlan(plan, 'GEMINI')) return 'GEMINI'
  return 'GROQ'
}

export function getDefaultModelForPlan(plan: PlanType | Plan, provider?: AiProvider): string {
  const p = provider ?? getDefaultProviderForPlan(plan)
  const allowed = getAllowedPresetsForProvider(plan, p)
  if (allowed.length > 0) return allowed[0].value
  return DEFAULT_MODEL[p]
}

/** Seçili model pakete uygun değilse en iyi izinli modele düşür. */
export function clampModelToPlan(
  plan: PlanType | Plan,
  provider: AiProvider,
  model: string
): { provider: AiProvider; model: string } {
  let p = provider
  if (!isProviderAllowedForPlan(plan, p)) {
    p = getDefaultProviderForPlan(plan)
  }
  if (isModelAllowedForPlan(plan, p, model)) {
    return { provider: p, model }
  }
  const allowed = getAllowedPresetsForProvider(plan, p)
  return { provider: p, model: allowed[0]?.value ?? DEFAULT_MODEL[p] }
}

export function getAllowedProvidersForPlan(plan: PlanType | Plan): AiProvider[] {
  return (Object.keys(MODEL_PRESETS) as AiProvider[]).filter((p) =>
    isProviderAllowedForPlan(plan, p)
  )
}

export function describePlanAiTiers(plan: PlanType | Plan, locale: 'tr' | 'en' = 'tr'): string[] {
  const en = locale === 'en'
  if (plan === 'STARTER') {
    return en
      ? [
          'Groq Llama & Mixtral (open source)',
          'Google Gemini Flash',
          'OpenRouter free models (Gemma, Llama, Qwen)',
          'Self-hosted Ollama',
        ]
      : [
          'Groq Llama & Mixtral (açık kaynak)',
          'Google Gemini Flash',
          'OpenRouter ücretsiz modeller (Gemma, Llama, Qwen)',
          'Kendi Ollama sunucunuz',
        ]
  }
  if (plan === 'PRO') {
    return en
      ? [
          'Everything in Starter tier',
          'OpenAI GPT-4o mini & GPT-4.1 mini',
          'Anthropic Claude Haiku & Sonnet 4',
          'Gemini 1.5/2.5 Pro & Flash',
        ]
      : [
          'Başlangıç katmanındaki tüm modeller',
          'OpenAI GPT-4o mini & GPT-4.1 mini',
          'Anthropic Claude Haiku & Sonnet 4',
          'Gemini 1.5/2.5 Pro & Flash',
        ]
  }
  if (plan === 'BUSINESS') {
    return en
      ? [
          'Everything in Pro tier',
          'OpenAI GPT-4o, GPT-4.1 & o3-mini',
          'Anthropic Claude Opus 4',
          'Gemini 2.5 Pro',
          'Premium OpenRouter models',
        ]
      : [
          'Profesyonel katmanındaki tüm modeller',
          'OpenAI GPT-4o, GPT-4.1 & o3-mini',
          'Anthropic Claude Opus 4',
          'Gemini 2.5 Pro',
          'OpenRouter premium modeller',
        ]
  }
  return []
}
