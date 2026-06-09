'use client'

import { useCallback, useEffect, useState } from 'react'
import { normalizeLangCode } from '@/lib/translate-languages'

const STORAGE_KEY = 'guchat-agent-lang'

export function useAgentLanguage() {
  const [agentLang, setAgentLangState] = useState('tr')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAgentLangState(normalizeLangCode(saved))
      } else if (typeof navigator !== 'undefined') {
        setAgentLangState(normalizeLangCode(navigator.language))
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

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
