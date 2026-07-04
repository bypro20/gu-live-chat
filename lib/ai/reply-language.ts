import { detectLanguageHint, languageLabel, normalizeLangCode } from '@/lib/translate-languages'

/** Widget / konuşma diline göre bot yanıt dili */
export function resolveVisitorReplyLanguage(options: {
  visitorLang?: string | null
  lastUserMessage?: string | null
  fallback?: string
}): string {
  const fromWidget = options.visitorLang ? normalizeLangCode(options.visitorLang) : null
  const fromMessage = options.lastUserMessage?.trim()
    ? detectLanguageHint(options.lastUserMessage)
    : null

  // Ziyaretçi mesajı net farklı bir dildeyse mesaja uy (dil değiştirdi)
  if (fromMessage && fromWidget && fromMessage !== fromWidget) {
    return fromMessage
  }

  return fromWidget || fromMessage || normalizeLangCode(options.fallback || 'tr')
}

/** System prompt sonuna eklenecek zorunlu dil kuralı */
export function replyLanguageInstruction(lang: string): string {
  const code = normalizeLangCode(lang)
  const label = languageLabel(code)
  return (
    `\n\nYANIT DİLİ (ZORUNLU): Tüm yanıtlarını yalnızca ${label} (${code}) dilinde yaz. ` +
    `Ziyaretçi başka bir dilde yazarsa o dilde yanıt ver. Asla farklı dilde yanıt verme.`
  )
}
