import type { AiProvider } from './provider'

export const MODEL_PRESETS: Record<AiProvider, { label: string; value: string; note?: string }[]> = {
  OPENAI: [
    { label: 'GPT-4o mini (hızlı, ekonomik)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o (en akıllı)', value: 'gpt-4o' },
    { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
  ],
  ANTHROPIC: [
    { label: 'Claude Haiku (hızlı)', value: 'claude-3-5-haiku-latest' },
    { label: 'Claude Sonnet (dengeli)', value: 'claude-sonnet-4-20250514' },
  ],
  GEMINI: [
    { label: 'Gemini 2.0 Flash (önerilen)', value: 'gemini-2.0-flash' },
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  ],
  GROQ: [
    { label: 'Llama 3.3 70B (açık kaynak, hızlı)', value: 'llama-3.3-70b-versatile' },
    { label: 'Llama 3.1 8B (çok hızlı)', value: 'llama-3.1-8b-instant' },
  ],
  OPENROUTER: [
    { label: 'Gemma 2 9B (ücretsiz, açık kaynak)', value: 'google/gemma-2-9b-it:free' },
    { label: 'Llama 3.2 3B (ücretsiz, açık kaynak)', value: 'meta-llama/llama-3.2-3b-instruct:free' },
    { label: 'Qwen 2 7B (ücretsiz)', value: 'qwen/qwen-2-7b-instruct:free' },
    { label: 'Llama 3.1 8B', value: 'meta-llama/llama-3.1-8b-instruct' },
  ],
  OLLAMA: [
    { label: 'Llama 3.2 (yerel)', value: 'llama3.2' },
    { label: 'Gemma 2 (yerel)', value: 'gemma2' },
    { label: 'Mistral (yerel)', value: 'mistral' },
    { label: 'Qwen 2.5 (yerel)', value: 'qwen2.5' },
  ],
}

export const DEFAULT_MODEL: Record<AiProvider, string> = {
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-haiku-latest',
  GEMINI: 'gemini-2.0-flash',
  GROQ: 'llama-3.3-70b-versatile',
  OPENROUTER: 'google/gemma-2-9b-it:free',
  OLLAMA: 'llama3.2',
}
