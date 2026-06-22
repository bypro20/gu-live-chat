import { normalizeLangCode } from '@/lib/translate-languages'

/** Web Speech API BCP-47 locale — Chrome/Safari için tam kod gerekir. */
const SPEECH_LOCALES: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fa: 'fa-IR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  hi: 'hi-IN',
  nl: 'nl-NL',
  pl: 'pl-PL',
  uk: 'uk-UA',
  az: 'az-AZ',
  sv: 'sv-SE',
  el: 'el-GR',
}

export function resolveSpeechLocale(agentLang?: string | null): string {
  const code = normalizeLangCode(agentLang || 'tr')
  return SPEECH_LOCALES[code] ?? 'tr-TR'
}

/** @deprecated use resolveSpeechLocale(agentLang) */
export function speechLocaleForLang(code?: string | null, siteLocale?: 'tr' | 'en'): string {
  if (siteLocale === 'tr' && (!code || normalizeLangCode(code) === 'en')) {
    return 'tr-TR'
  }
  return resolveSpeechLocale(code || siteLocale)
}
