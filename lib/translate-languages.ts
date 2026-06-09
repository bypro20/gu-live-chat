/** Desteklenen diller — widget, inbox ve API aynı listeyi kullanır. */
export const TRANSLATE_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
] as const

export function normalizeLangCode(code?: string | null): string {
  if (!code) return 'en'
  const base = code.toLowerCase().split('-')[0]
  if (base === 'auto' || base === 'detect') return 'en'
  return TRANSLATE_LANGUAGES.some((l) => l.code === base) ? base : base.slice(0, 2)
}

/** 'auto' / boş → undefined; geçerli ISO kod döner */
export function resolveSourceLang(code?: string | null): string | undefined {
  if (!code) return undefined
  const base = code.toLowerCase().split('-')[0]
  if (base === 'auto' || base === 'detect') return undefined
  return normalizeLangCode(code)
}

/** MyMemory / API hata metinlerini filtrele */
export function isTranslationEngineError(text: string): boolean {
  const upper = text.toUpperCase()
  return (
    upper.includes('INVALID SOURCE LANGUAGE') ||
    upper.includes('LANGPAIR=') ||
    upper.includes('IS AN INVALID SOURCE') ||
    upper.includes('QUERY LENGTH LIMIT') ||
    upper.includes('MYMEMORY WARNING')
  )
}

/** Kaynak dil bilinmiyorsa metinden tahmin et (MyMemory auto desteklemez). */
export function detectLanguageHint(text: string): string {
  const sample = text.trim().slice(0, 400)
  if (!sample) return 'en'

  if (/[\u0600-\u06FF]/.test(sample)) return /[\u067E\u0686\u0698\u06AF]/.test(sample) ? 'fa' : 'ar'
  if (/[\u0400-\u04FF]/.test(sample)) return 'ru'
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh'
  if (/[\u3040-\u30ff]/.test(sample)) return 'ja'
  if (/[\uac00-\ud7af]/.test(sample)) return 'ko'
  if (/[\u0900-\u097F]/.test(sample)) return 'hi'
  if (/[\u0590-\u05FF]/.test(sample)) return 'he'
  if (/[\u0370-\u03FF]/.test(sample)) return 'el'

  if (/[ğüşıöçĞÜŞİÖÇ]/.test(sample)) return 'tr'
  if (/\b(merhaba|nasılsın|teşekkür|yardım|için|bir|veya|güzel|hoş)\b/i.test(sample)) return 'tr'

  if (/\b(hello|thanks|please|welcome|how|your|the|and|with)\b/i.test(sample)) return 'en'
  if (/\b(hallo|danke|bitte|guten)\b/i.test(sample)) return 'de'
  if (/\b(bonjour|merci|vous|pour)\b/i.test(sample)) return 'fr'
  if (/\b(hola|gracias|por favor)\b/i.test(sample)) return 'es'

  return 'en'
}

export function languageLabel(code?: string | null): string {
  const n = normalizeLangCode(code)
  return TRANSLATE_LANGUAGES.find((l) => l.code === n)?.label || n.toUpperCase()
}

export function languagesDiffer(a?: string | null, b?: string | null): boolean {
  return normalizeLangCode(a) !== normalizeLangCode(b)
}
