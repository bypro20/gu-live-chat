'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Mic, MicOff, Volume2 } from 'lucide-react'

type ChatTurn = { role: 'user' | 'assistant'; content: string }

export default function VoiceAssistantPage() {
  const params = useParams()
  const websiteId = String(params.websiteId || '')
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Yükleniyor...')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [history, setHistory] = useState<ChatTurn[]>([])
  const [agentName, setAgentName] = useState('Sesli Asistan')
  const [speechLang, setSpeechLang] = useState('tr-TR')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speakingRef = useRef(false)

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 1
    speakingRef.current = true
    utter.onend = () => {
      speakingRef.current = false
    }
    window.speechSynthesis.speak(utter)
  }, [])

  const askAi = useCallback(
    async (message: string) => {
      setStatus('Düşünüyor...')
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, message, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yanıt alınamadı')
      const answer = String(data.reply || '')
      setReply(answer)
      setHistory((h) => [
        ...h,
        { role: 'user', content: message },
        { role: 'assistant', content: answer },
      ])
      setStatus('Hazır — konuşmak için mikrofona dokunun')
      return answer
    },
    [history, websiteId]
  )

  useEffect(() => {
    if (!websiteId) return
    fetch(`/api/voice/public?websiteId=${websiteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.agent?.name) setAgentName(data.agent.name)
        const lang = data.agent?.language || 'tr-TR'
        setSpeechLang(lang)
        if (data.agent?.greeting) {
          setReply(data.agent.greeting)
          speak(data.agent.greeting, lang)
        }
        setStatus('Hazır — konuşmak için mikrofona dokunun')
      })
      .catch(() => setStatus('Sesli asistan yapılandırılamadı'))
  }, [websiteId, speak])

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null
    if (!SpeechRecognitionCtor) {
      setStatus('Tarayıcınız konuşma tanımayı desteklemiyor')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = speechLang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim()
      if (!text) return
      setTranscript(text)
      void (async () => {
        try {
          const answer = await askAi(text)
          speak(answer, speechLang)
        } catch (err) {
          setStatus(err instanceof Error ? err.message : 'Hata')
        }
      })()
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setStatus('Mikrofon hatası — tekrar deneyin')
    }

    recognitionRef.current = recognition
    return () => {
      recognition.stop()
    }
  }, [askAi, speak, speechLang])

  const toggleListen = () => {
    const recognition = recognitionRef.current
    if (!recognition || speakingRef.current) return
    if (listening) {
      recognition.stop()
      setListening(false)
      return
    }
    setTranscript('')
    setListening(true)
    setStatus('Dinliyor...')
    recognition.start()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div>
          <p className="text-sm text-slate-400 mb-1">Gu Live Chat</p>
          <h1 className="text-2xl font-semibold">{agentName}</h1>
        </div>

        <button
          type="button"
          onClick={toggleListen}
          className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 transition ${
            listening
              ? 'border-red-400 bg-red-500/20 animate-pulse'
              : 'border-primary bg-primary/20 hover:bg-primary/30'
          }`}
          aria-label={listening ? 'Dinlemeyi durdur' : 'Konuşmaya başla'}
        >
          {listening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </button>

        <p className="text-sm text-slate-300">{status}</p>

        {transcript && (
          <div className="rounded-xl bg-white/5 p-4 text-left text-sm">
            <p className="text-slate-400 text-xs mb-1">Siz</p>
            <p>{transcript}</p>
          </div>
        )}

        {reply && (
          <div className="rounded-xl bg-primary/10 p-4 text-left text-sm">
            <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Volume2 className="h-3 w-3" /> Asistan
            </p>
            <p>{reply}</p>
          </div>
        )}
      </div>
    </div>
  )
}
