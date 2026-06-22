'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { speechLocaleForLang } from '@/lib/speech-locale'

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [alt: number]: { transcript: string }
    }
  }
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechInputSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

type UseSpeechInputOptions = {
  lang: string
  siteLocale?: 'tr' | 'en'
  onFinalText: (text: string) => void
  onInterimText?: (text: string) => void
}

export function useSpeechInput({
  lang,
  siteLocale,
  onFinalText,
  onInterimText,
}: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseTextRef = useRef('')
  const supported = isSpeechInputSupported()

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(
    (currentValue: string) => {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) {
        setError('unsupported')
        return
      }

      recognitionRef.current?.abort()

      const recognition = new Ctor()
      recognition.lang = speechLocaleForLang(lang, siteLocale)
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      baseTextRef.current = currentValue.trimEnd()

      recognition.onresult = (event) => {
        let interim = ''
        let finalChunk = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0]?.transcript ?? ''
          if (result.isFinal) {
            finalChunk += transcript
          } else {
            interim += transcript
          }
        }

        if (finalChunk) {
          const prefix = baseTextRef.current
          const joined = prefix ? `${prefix} ${finalChunk.trim()}` : finalChunk.trim()
          baseTextRef.current = joined
          onFinalText(joined)
        } else if (interim && onInterimText) {
          const prefix = baseTextRef.current
          onInterimText(prefix ? `${prefix} ${interim}` : interim)
        }
      }

      recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(event.error)
        }
        setListening(false)
      }

      recognition.onend = () => {
        setListening(false)
      }

      recognitionRef.current = recognition
      setError(null)
      setListening(true)

      try {
        recognition.start()
      } catch {
        setError('start-failed')
        setListening(false)
      }
    },
    [lang, siteLocale, onFinalText, onInterimText],
  )

  const toggle = useCallback(
    (currentValue: string) => {
      if (listening) {
        stop()
        return
      }
      start(currentValue)
    },
    [listening, start, stop],
  )

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { supported, listening, error, toggle, stop }
}
