import type { AiProvider } from './provider'

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
  OLLAMA: [
    { label: 'Llama 3.2 (yerel)', value: 'llama3.2', tier: 'economy' },
    { label: 'Gemma 2 (yerel)', value: 'gemma2', tier: 'economy' },
    { label: 'Mistral (yerel)', value: 'mistral', tier: 'economy' },
    { label: 'Qwen 2.5 (yerel)', value: 'qwen2.5', tier: 'standard' },
    { label: 'DeepSeek R1 (yerel)', value: 'deepseek-r1', tier: 'premium' },
  ],
}

export const DEFAULT_MODEL: Record<AiProvider, string> = {
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-haiku-latest',
  GEMINI: 'gemini-2.5-flash',
  GROQ: 'llama-3.3-70b-versatile',
  OPENROUTER: 'google/gemma-2-9b-it:free',
  OLLAMA: 'llama3.2',
}

export function findModelPreset(provider: AiProvider, model: string): ModelPreset | undefined {
  return MODEL_PRESETS[provider].find((m) => m.value === model)
}

export function modelTierRank(tier: AiModelTier): number {
  if (tier === 'economy') return 1
  if (tier === 'standard') return 2
  return 3
}
