'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

function buildSessionTranscript(event: SpeechRecognitionEventLike): { text: string; hasFinal: boolean } {
  let text = ''
  let hasFinal = false
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i]
    text += result[0]?.transcript ?? ''
    if (result.isFinal) hasFinal = true
  }
  return { text: text.trim(), hasFinal }
}

type UseSpeechInputOptions = {
  speechLocale: string
  onFinalText: (text: string) => void
  onInterimText?: (text: string) => void
}

export function useSpeechInput({
  speechLocale,
  onFinalText,
  onInterimText,
}: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const activeRef = useRef(false)
  const baseTextRef = useRef('')
  const supported = isSpeechInputSupported()

  const stop = useCallback(() => {
    activeRef.current = false
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
      activeRef.current = true
      baseTextRef.current = currentValue.trimEnd()

      const recognition = new Ctor()
      recognition.lang = speechLocale
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        const { text: sessionText, hasFinal } = buildSessionTranscript(event)
        if (!sessionText) return

        const prefix = baseTextRef.current
        const joined = prefix ? `${prefix} ${sessionText}` : sessionText

        if (hasFinal) {
          baseTextRef.current = joined
          onFinalText(joined)
        } else if (onInterimText) {
          onInterimText(joined)
        }
      }

      recognition.onerror = (event) => {
        if (event.error === 'aborted') return
        if (event.error === 'no-speech') return
        setError(event.error)
        activeRef.current = false
        setListening(false)
      }

      recognition.onend = () => {
        if (activeRef.current) {
          try {
            recognition.start()
            return
          } catch {
            activeRef.current = false
          }
        }
        setListening(false)
      }

      recognitionRef.current = recognition
      setError(null)
      setListening(true)

      try {
        recognition.start()
      } catch {
        activeRef.current = false
        setError('start-failed')
        setListening(false)
      }
    },
    [speechLocale, onFinalText, onInterimText],
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
      activeRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  return { supported, listening, error, toggle, stop, speechLocale }
}
