import type { ChatMessage } from './provider'
import { DEFAULT_MODEL, findModelPreset, MODEL_PRESETS, type AiModelTier } from './models'
import type { AiProvider } from './provider'

const COMPLEX_HINTS =
  /\b(neden|how|why|açıkla|explain|karşılaştır|compare|fark|detay|detail|adım|step|sorun|problem|iade|refund|entegrasyon|integration|kurulum|setup)\b/i

export type QueryComplexity = 'simple' | 'complex'

export function estimateQueryComplexity(messages: ChatMessage[]): QueryComplexity {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
  if (last.length > 220) return 'complex'
  if (messages.length >= 10) return 'complex'
  if (COMPLEX_HINTS.test(last)) return 'complex'
  if ((last.match(/\?/g) || []).length >= 2) return 'complex'
  return 'simple'
}

function tierForComplexity(complexity: QueryComplexity): AiModelTier {
  return complexity === 'complex' ? 'standard' : 'economy'
}

/** Pick a model tier based on query complexity; keeps provider unchanged. */
export function pickRoutedModel(
  provider: AiProvider,
  currentModel: string,
  messages: ChatMessage[]
): string {
  const targetTier = tierForComplexity(estimateQueryComplexity(messages))
  const current = findModelPreset(provider, currentModel)
  if (current && current.tier === targetTier) return currentModel

  const presets = MODEL_PRESETS[provider] ?? []
  const match = presets.find((p) => p.tier === targetTier)
  return match?.value ?? currentModel ?? DEFAULT_MODEL[provider]
}
