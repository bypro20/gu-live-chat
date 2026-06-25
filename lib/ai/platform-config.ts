import type { AiProvider } from './provider'

/** Vercel / sunucu ortamında platform geneli AI — tüm müşteri siteleri için yedek. */
export const PLATFORM_AI_PROVIDER: AiProvider = 'GEMINI'
export const PLATFORM_AI_MODEL = 'gemini-2.5-flash'

export const PLATFORM_AI_ENV_KEYS = ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'] as const

/** Platform Gemini anahtarı (GEMINI_API_KEY veya GOOGLE_AI_API_KEY). */
export function getPlatformGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    ''
  )
}

export function isPlatformGeminiConfigured(): boolean {
  return getPlatformGeminiKey().length > 0
}

export function platformAiEnvHint(): string {
  return `Vercel Production → ${PLATFORM_AI_ENV_KEYS.join(' veya ')}`
}
