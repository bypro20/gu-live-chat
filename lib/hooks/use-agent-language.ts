'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from '@/components/marketing/locale-provider'
import { normalizeLangCode } from '@/lib/translate-languages'

const STORAGE_KEY = 'guchat-agent-lang'

export function useAgentLanguage() {
  const { locale: siteLocale } = useLocale()
  const [agentLang, setAgentLangState] = useState('tr')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAgentLangState(normalizeLangCode(saved))
      } else {
        // Site Türkçe ise varsayılan temsilci dili Türkçe (tarayıcı en-US olsa bile)
        setAgentLangState(siteLocale === 'tr' ? 'tr' : normalizeLangCode(navigator.language))
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [siteLocale])

  const setAgentLang = useCallback((code: string) => {
    const n = normalizeLangCode(code)
    setAgentLangState(n)
    try {
      localStorage.setItem(STORAGE_KEY, n)
    } catch {
      /* ignore */
    }
  }, [])

  return { agentLang, setAgentLang, ready }
}
