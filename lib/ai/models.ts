import type { AiProvider } from './provider'
import { inferTierFromModelName, resolveOllamaPresets } from './ollama-models'

/** Model maliyet / yetenek katmanı — paket fiyatına göre erişim kontrolü. */
export type AiModelTier = 'economy' | 'standard' | 'premium'

export interface ModelPreset {
  label: string
  value: string
  tier: AiModelTier
  note?: string
}

export const MODEL_PRESETS: Record<AiProvider, ModelPreset[]> = {
  OPENAI: [
    { label: 'GPT-4o mini (hızlı, ekonomik)', value: 'gpt-4o-mini', tier: 'economy' },
    { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini', tier: 'standard' },
    { label: 'GPT-4o (en akıllı)', value: 'gpt-4o', tier: 'premium' },
    { label: 'GPT-4.1', value: 'gpt-4.1', tier: 'premium' },
    { label: 'o3-mini (akıl yürütme)', value: 'o3-mini', tier: 'premium' },
  ],
  ANTHROPIC: [
    { label: 'Claude Haiku (hızlı)', value: 'claude-3-5-haiku-latest', tier: 'economy' },
    { label: 'Claude Sonnet 4 (dengeli)', value: 'claude-sonnet-4-20250514', tier: 'standard' },
    { label: 'Claude Opus 4 (en güçlü)', value: 'claude-opus-4-20250514', tier: 'premium' },
  ],
  GEMINI: [
    { label: 'Gemini 2.5 Flash (önerilen)', value: 'gemini-2.5-flash', tier: 'economy' },
    { label: 'Gemini 2.5 Flash-Lite (hızlı)', value: 'gemini-2.5-flash-lite', tier: 'economy' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro', tier: 'standard' },
    { label: 'Gemini 3.5 Flash (en yeni)', value: 'gemini-3.5-flash', tier: 'standard' },
    { label: 'Gemini 3.1 Flash-Lite', value: 'gemini-3.1-flash-lite', tier: 'premium' },
  ],
  GROQ: [
    { label: 'Llama 3.1 8B (çok hızlı)', value: 'llama-3.1-8b-instant', tier: 'economy' },
    { label: 'Llama 3.3 70B (açık kaynak)', value: 'llama-3.3-70b-versatile', tier: 'standard' },
    { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768', tier: 'economy' },
    { label: 'DeepSeek R1 Distill Llama 70B', value: 'deepseek-r1-distill-llama-70b', tier: 'standard' },
  ],
  OPENROUTER: [
    { label: 'Gemma 2 9B (ücretsiz)', value: 'google/gemma-2-9b-it:free', tier: 'economy' },
    { label: 'Llama 3.2 3B (ücretsiz)', value: 'meta-llama/llama-3.2-3b-instruct:free', tier: 'economy' },
    { label: 'Qwen 2 7B (ücretsiz)', value: 'qwen/qwen-2-7b-instruct:free', tier: 'economy' },
    { label: 'Llama 3.1 8B', value: 'meta-llama/llama-3.1-8b-instruct', tier: 'economy' },
    { label: 'Llama 3.3 70B', value: 'meta-llama/llama-3.3-70b-instruct', tier: 'standard' },
    { label: 'DeepSeek Chat V3', value: 'deepseek/deepseek-chat', tier: 'standard' },
    { label: 'Claude Sonnet (OpenRouter)', value: 'anthropic/claude-sonnet-4', tier: 'premium' },
    { label: 'GPT-4o (OpenRouter)', value: 'openai/gpt-4o', tier: 'premium' },
  ],
  /** Canavar AI + coder modelleri (gulivechat.online / OLLAMA_MODELS ile birleşir) */
  OLLAMA: [
    { label: 'Canavar AI 14B (tam yetenek · önerilen)', value: 'canavar-ai:latest', tier: 'standard', note: 'Modelfile.canavar' },
    { label: 'Qwen2.5 Coder 14B', value: 'qwen2.5-coder:14b', tier: 'standard' },
    { label: 'Qwen2.5 Coder 7B (hızlı)', value: 'qwen2.5-coder:7b', tier: 'economy' },
  ],
}

export const DEFAULT_MODEL: Record<AiProvider, string> = {
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-haiku-latest',
  GEMINI: 'gemini-2.5-flash',
  GROQ: 'llama-3.3-70b-versatile',
  OPENROUTER: 'google/gemma-2-9b-it:free',
  OLLAMA: '',
}

export function getProviderPresets(provider: AiProvider): ModelPreset[] {
  if (provider === 'OLLAMA') {
    return resolveOllamaPresets(MODEL_PRESETS.OLLAMA)
  }
  return MODEL_PRESETS[provider]
}

export function getDefaultModelForProvider(provider: AiProvider): string {
  if (provider === 'OLLAMA') {
    const presets = getProviderPresets('OLLAMA')
    if (presets.length > 0) return presets[0].value
    return DEFAULT_MODEL.OLLAMA || 'llama3.2'
  }
  return DEFAULT_MODEL[provider]
}

export function findModelPreset(provider: AiProvider, model: string): ModelPreset | undefined {
  const direct = getProviderPresets(provider).find((m) => m.value === model)
  if (direct) return direct
  if (provider === 'OLLAMA' && model) {
    const tier = inferTierFromModelName(model)
    return { value: model, label: model, tier }
  }
  return undefined
}

export function modelTierRank(tier: AiModelTier): number {
  if (tier === 'economy') return 1
  if (tier === 'standard') return 2
  return 3
}
