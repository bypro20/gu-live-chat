'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadWidgetTranslationCache,
  saveWidgetTranslationCache,
  translationsForLang,
  widgetTranslateCacheKey,
} from '@/lib/widget-translate-cache'

type TranslateApiResponse = {
  available?: boolean
  translatedText?: string
  upgradeRequired?: boolean
  sameLanguage?: boolean
}

export function useWidgetTranslations(opts: {
  websiteId: string
  lang: string
  enabled: boolean
  autoTranslateOn: boolean
}) {
  const { websiteId, lang, enabled, autoTranslateOn } = opts

  const [translations, setTranslations] = useState<Record<string, string>>({})
  /** true = orijinal metin göster (çeviri gizli) */
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({})
  const [translatingId, setTranslatingId] = useState<string | null>(null)

  const cacheRef = useRef<Record<string, string>>({})
  const inFlightRef = useRef(new Set<string>())

  useEffect(() => {
    cacheRef.current = loadWidgetTranslationCache(websiteId)
    setTranslations(translationsForLang(cacheRef.current, lang))
    setShowOriginal({})
  }, [websiteId, lang])

  const persistTranslation = useCallback(
    (messageId: string, text: string) => {
      const key = widgetTranslateCacheKey(messageId, lang)
      cacheRef.current = { ...cacheRef.current, [key]: text }
      saveWidgetTranslationCache(websiteId, cacheRef.current)
    },
    [websiteId, lang]
  )

  const translateMessage = useCallback(
    async (messageId: string, content: string, opts2?: { silent?: boolean }) => {
      if (!enabled || !content?.trim()) return null

      if (translations[messageId]) {
        setShowOriginal((prev) => ({
          ...prev,
          [messageId]: !prev[messageId],
        }))
        return translations[messageId]
      }

      if (inFlightRef.current.has(messageId)) return null
      inFlightRef.current.add(messageId)
      if (!opts2?.silent) setTranslatingId(messageId)

      try {
        const res = await fetch('/api/widget/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId,
            text: content,
            targetLang: lang,
          }),
        })
        const data = (await res.json()) as TranslateApiResponse
        if (data.upgradeRequired) return null

        const translated = (data.translatedText ?? content).trim()
        if (data.available === false && !data.sameLanguage) return null

        setTranslations((prev) => ({ ...prev, [messageId]: translated }))
        persistTranslation(messageId, translated)
        setShowOriginal((prev) => ({ ...prev, [messageId]: false }))
        return translated
      } catch {
        return null
      } finally {
        inFlightRef.current.delete(messageId)
        if (!opts2?.silent) setTranslatingId(null)
      }
    },
    [enabled, websiteId, lang, translations, persistTranslation]
  )

  const autoTranslateIncoming = useCallback(
    (messages: Array<{ id: string; content: string; senderType: string }>) => {
      if (!enabled || !autoTranslateOn) return
      for (const msg of messages) {
        if (msg.senderType !== 'AGENT' && msg.senderType !== 'BOT') continue
        if (!msg.content?.trim()) continue
        if (translations[msg.id] || inFlightRef.current.has(msg.id)) continue
        void translateMessage(msg.id, msg.content, { silent: true })
      }
    },
    [enabled, autoTranslateOn, translations, translateMessage]
  )

  const isShowingOriginal = useCallback(
    (messageId: string) => !!showOriginal[messageId],
    [showOriginal]
  )

  const getDisplayText = useCallback(
    (messageId: string, original: string) => {
      const tr = translations[messageId]
      if (!tr || tr.trim() === original.trim()) {
        return { primary: original, secondary: null as string | null, mode: 'original' as const }
      }
      if (showOriginal[messageId]) {
        return { primary: original, secondary: tr, mode: 'original' as const }
      }
      return { primary: tr, secondary: original, mode: 'translated' as const }
    },
    [translations, showOriginal]
  )

  return {
    translations,
    translatingId,
    translateMessage,
    autoTranslateIncoming,
    isShowingOriginal,
    getDisplayText,
    hasTranslation: (messageId: string) => !!translations[messageId],
  }
}
