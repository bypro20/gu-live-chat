'use client'

import { useCallback, useEffect, useState } from 'react'
import { readInboxAutoTranslatePref, writeInboxAutoTranslatePref } from '@/lib/translate-prefs'

export function useInboxAutoTranslate(canTranslate: boolean) {
  const [autoTranslate, setAutoTranslateState] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canTranslate) {
      setAutoTranslateState(false)
      setReady(true)
      return
    }
    const saved = readInboxAutoTranslatePref()
    setAutoTranslateState(saved ?? true)
    setReady(true)
  }, [canTranslate])

  const setAutoTranslate = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setAutoTranslateState((prev) => {
        const value = typeof next === 'function' ? next(prev) : next
        if (canTranslate) writeInboxAutoTranslatePref(value)
        return value
      })
    },
    [canTranslate]
  )

  const toggleAutoTranslate = useCallback(() => {
    setAutoTranslate((v) => !v)
  }, [setAutoTranslate])

  return { autoTranslate, setAutoTranslate, toggleAutoTranslate, ready }
}
