'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import { connectSocket, getSocket, retainSocket, releaseSocket, isSocketEnabled } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

interface WidgetConfig {
  primaryColor: string
  position: string
  welcomeMessage: string
  offlineMessage: string
  avatarUrl: string | null
  websiteName: string | null
  agentsOnline: number
}

interface Attachment {
  id?: string
  url: string
  fileName: string
  fileSize?: number | null
  mimeType?: string | null
}

interface Message {
  id: string
  content: string
  type: string
  senderType: 'VISITOR' | 'AGENT' | 'BOT' | 'SYSTEM'
  senderName?: string
  createdAt: string
  attachments?: Attachment[]
}

// ─── Lightweight i18n (TR default, EN optional) ─────────────────────────
// The message-translation engine (lib/ai/translate.ts) works with ANY target
// language. `lang` therefore holds any ISO 639-1 code; only the static UI
// dictionary is limited to TR/EN (everything else falls back to English).
type WidgetLang = string

// Comprehensive translation target list: ISO 639-1 code + native name.
const WIDGET_LANGUAGES: { code: string; name: string }[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'fa', name: 'فارسی' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ur', name: 'اردو' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'cs', name: 'Čeština' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'hu', name: 'Magyar' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'da', name: 'Dansk' },
  { code: 'he', name: 'עברית' },
  { code: 'sr', name: 'Српски' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'az', name: 'Azərbaycanca' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'hy', name: 'Հայերեն' },
  { code: 'ka', name: 'ქართული' },
  { code: 'et', name: 'Eesti' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'lv', name: 'Latviešu' },
]

const WIDGET_STRINGS = {
  tr: {
    online: 'Çevrimiçi',
    typicalReply: 'Tipik yanıt: 2 dk',
    today: 'Bugün',
    welcomeFallback: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
    quickChat: '💬 Sohbet başlat',
    quickPricing: '💰 Fiyatlandırma',
    quickSupport: '🛠️ Destek talebi',
    preChatHi: 'Merhaba! 👋',
    preChatSub: 'Sohbete başlamak için bilgilerinizi girin',
    namePlaceholder: 'Adınız',
    emailPlaceholder: 'E-posta adresiniz',
    startChat: 'Sohbete Başla',
    sslNote: '256-bit SSL ile korunmaktadır',
    inputPlaceholder: 'Mesajınızı yazın...',
    poweredBy: 'Gu Live Chat',
    help: '📚 Yardım',
    backToChat: 'Sohbete Dön',
    back: '← Geri',
    loading: 'Yükleniyor...',
    noArticles: 'Henüz yardım makalesi bulunmuyor.',
    rateChat: 'Sohbeti değerlendirin',
    commentPlaceholder: 'Yorum ekleyin (isteğe bağlı)...',
    send: 'Gönder',
    sending: 'Gönderiliyor...',
    thanksRating: 'Değerlendirmeniz için teşekkür ederiz! 🙏',
    thanksRatingSub: 'Görüşleriniz bizim için çok değerli',
    close: 'Kapat',
    attachFile: 'Dosya ekle',
    uploading: 'Yükleniyor...',
    fileTooLarge: "Dosya boyutu 10MB'dan büyük olamaz.",
    fileTypeError: 'Desteklenmeyen dosya türü.',
    uploadError: 'Dosya yüklenemedi, lütfen tekrar deneyin.',
    download: 'İndir',
    translate: 'Çevir',
    showOriginal: 'Orijinali göster',
    translating: 'Çevriliyor...',
    emoji: 'Emoji',
    langName: 'Türkçe',
  },
  en: {
    online: 'Online',
    typicalReply: 'Typically replies in 2 min',
    today: 'Today',
    welcomeFallback: 'Hello! 👋 How can we help you?',
    quickChat: '💬 Start chat',
    quickPricing: '💰 Pricing',
    quickSupport: '🛠️ Support request',
    preChatHi: 'Hello! 👋',
    preChatSub: 'Enter your details to start chatting',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email address',
    startChat: 'Start Chat',
    sslNote: 'Protected with 256-bit SSL',
    inputPlaceholder: 'Type your message...',
    poweredBy: 'Gu Live Chat',
    help: '📚 Help',
    backToChat: 'Back to chat',
    back: '← Back',
    loading: 'Loading...',
    noArticles: 'No help articles yet.',
    rateChat: 'Rate this chat',
    commentPlaceholder: 'Add a comment (optional)...',
    send: 'Send',
    sending: 'Sending...',
    thanksRating: 'Thank you for your feedback! 🙏',
    thanksRatingSub: 'Your opinion matters to us',
    close: 'Close',
    attachFile: 'Attach file',
    uploading: 'Uploading...',
    fileTooLarge: 'File size cannot exceed 10MB.',
    fileTypeError: 'Unsupported file type.',
    uploadError: 'Upload failed, please try again.',
    download: 'Download',
    translate: 'Translate',
    showOriginal: 'Show original',
    translating: 'Translating...',
    emoji: 'Emoji',
    langName: 'English',
  },
} as const

type WidgetStrings = Record<keyof typeof WIDGET_STRINGS['tr'], string>

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ACCEPTED_UPLOAD = 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx'

function isImageAttachment(a: Attachment): boolean {
  if (a.mimeType) return a.mimeType.startsWith('image/')
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.fileName || a.url)
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

interface KBArticle {
  id: string
  title: string
  content: string
  createdAt: string
}

const formatTime = (date: string) => {
  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Merge server-fetched messages (source of truth) into the local list,
 * idempotently by id. Optimistic visitor messages (temp_*) that the server
 * hasn't persisted yet are preserved so the UI never flickers or loses text.
 * Returns the previous array reference unchanged when nothing differs, to
 * avoid needless re-renders / scroll jumps while polling.
 */
function mergeWidgetMessages(prev: Message[], incoming: Message[]): Message[] {
  const serverKeys = new Set(incoming.map((m) => `${m.senderType}|${m.content}`))
  const pendingTemps = prev.filter(
    (m) => m.id.startsWith('temp_') && !serverKeys.has(`${m.senderType}|${m.content}`)
  )

  const merged = [...incoming, ...pendingTemps].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Bail out if the resulting list is identical (same ids, same order).
  if (merged.length === prev.length && merged.every((m, i) => m.id === prev[i].id)) {
    return prev
  }
  return merged
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function WidgetPage() {
  const params = useParams()
  const websiteId = params.websiteId as string

  const [isOpen, setIsOpen] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [mounted, setMounted] = useState(false)
  const visitorTokenRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [estimatedWait, setEstimatedWait] = useState('')
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [showPreChat, setShowPreChat] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationStatus, setConversationStatus] = useState<string | null>(null)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [proactiveMessage, setProactiveMessage] = useState<{ id: string; title: string; message: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false)
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null)
  const [kbLoading, setKbLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSending, setRatingSending] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [lang, setLang] = useState<WidgetLang>('tr')
  const [aiTranslateAvailable, setAiTranslateAvailable] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translatingId, setTranslatingId] = useState<string | null>(null)

  // UI dictionary only ships TR/EN; any other selected language falls back to
  // English for interface labels while message translation still targets it.
  const t: WidgetStrings = WIDGET_STRINGS[lang as keyof typeof WIDGET_STRINGS] || WIDGET_STRINGS.en

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const seenAgentCountRef = useRef(0)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const gifBtnRef = useRef<HTMLButtonElement>(null)
  const lastTypingEmitRef = useRef(0)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initWidget = async () => {
      const fingerprint = getFingerprint()

      try {
        const res = await fetch('/api/widget/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId,
            fingerprint,
            currentPage: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }),
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          setInitError(data.error || 'Bağlantı hatası')
          setConfig({
            primaryColor: '#1972F5',
            position: 'BOTTOM_RIGHT',
            welcomeMessage: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
            offlineMessage: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
            avatarUrl: null,
            websiteName: null,
            agentsOnline: 1,
          })
          setIsInitialized(true)
          return
        }

        setConfig(data.websiteConfig)
        setConversationId(data.conversationId)
        setAiTranslateAvailable(!!data.features?.aiTranslate)
        setIsInitialized(true)

        visitorTokenRef.current = data.visitorToken
        sessionIdRef.current = data.sessionId
      } catch (error) {
        console.error('[Gu Widget] Init failed:', error)
        setInitError('Bağlantı hatası')
        setConfig({
          primaryColor: '#1972F5',
          position: 'BOTTOM_RIGHT',
          welcomeMessage: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
          offlineMessage: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
          avatarUrl: null,
          websiteName: null,
          agentsOnline: 1,
        })
        setIsInitialized(true)
      }
    }

    initWidget()
  }, [websiteId])

  useEffect(() => {
    if (!isInitialized) return
    const pos = Math.floor(Math.random() * 4) + 1
    setQueuePosition(pos)
    const waits = ['1 dk', '2 dk', '3 dk', '4 dk', '5 dk']
    setEstimatedWait(waits[Math.min(pos - 1, waits.length - 1)])
    const timer = setInterval(() => {
      setQueuePosition(prev => Math.max(0, prev - (Math.random() > 0.5 ? 1 : 0)))
    }, 8000)
    return () => clearInterval(timer)
  }, [isInitialized])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Report unread agent/bot messages to the parent launcher (badge) while the
  // chat window is closed; clear the count as soon as it's opened.
  useEffect(() => {
    const agentCount = messages.filter(
      (m) => m.senderType === 'AGENT' || m.senderType === 'BOT'
    ).length
    if (isOpen) {
      seenAgentCountRef.current = agentCount
      window.parent?.postMessage({ type: 'gu:unread', count: 0 }, '*')
      return
    }
    const unread = Math.max(0, agentCount - seenAgentCountRef.current)
    window.parent?.postMessage({ type: 'gu:unread', count: unread }, '*')
  }, [messages, isOpen])

  useEffect(() => {
    let screenshotForwardCount = 0
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return

      if (event.data.type === 'gu:open') {
        setIsOpen(true)
      } else if (event.data.type === 'gu:close') {
        setIsOpen(false)
      } else if (event.data.type === 'gu:visitor:activity') {
        const socket = getSocket()
        const payload: Record<string, any> = {
          visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
          websiteId,
          eventType: event.data.eventType,
          selector: event.data.selector || '',
          text: event.data.text || '',
          url: event.data.url || window.location.href,
          x: event.data.x,
          y: event.data.y,
          timestamp: event.data.timestamp || new Date().toISOString(),
        }
        if (event.data.viewportW) payload.viewportW = event.data.viewportW
        if (event.data.viewportH) payload.viewportH = event.data.viewportH
        if (event.data.scrollY != null) payload.scrollY = event.data.scrollY
        if (event.data.scrollPercentage != null) payload.scrollPercentage = event.data.scrollPercentage
        if (event.data.documentH) payload.documentH = event.data.documentH
        if (event.data.fieldName) payload.fieldName = event.data.fieldName
        if (event.data.fieldType) payload.fieldType = event.data.fieldType

        if (socket) {
          socket.emit('visitor:activity', payload)
        }
      } else if (event.data.type === 'gu:visitor:screenshot') {
        const socket = getSocket()
        if (socket) {
          const screenshotSize = event.data.screenshot ? Math.round(event.data.screenshot.length / 1024) : 0
          if (!screenshotForwardCount) screenshotForwardCount = 0
          screenshotForwardCount++
          if (screenshotForwardCount % 10 === 1) {
            console.log(`[Widget] Forwarding screenshot #${screenshotForwardCount}, size: ${screenshotSize}KB, privacy: ${!!event.data.privacyMode}`)
          }
          socket.emit('visitor:screenshot', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            screenshot: event.data.screenshot,
            viewportW: event.data.viewportW,
            viewportH: event.data.viewportH,
            scrollY: event.data.scrollY,
            documentH: event.data.documentH,
            privacyMode: event.data.privacyMode || false,
            timestamp: event.data.timestamp || new Date().toISOString(),
          })
        }
      } else if (event.data.type === 'gu:proactive') {
        setProactiveMessage({
          id: event.data.id,
          title: event.data.title,
          message: event.data.message,
        })
        setTimeout(() => {
          setProactiveMessage((prev) => prev?.id === event.data.id ? null : prev)
        }, 10000)
      } else if (event.data.type === 'gu:privacy-mode') {
        const socket = getSocket()
        if (socket) {
          socket.emit('visitor:privacy-mode', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            enabled: event.data.enabled,
          })
        }
      } else if (event.data.type === 'gu:webrtc:stream-ready') {
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:stream-ready', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:denied') {
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:denied', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:stopped') {
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:stop', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:offer') {
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:signal', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            signal: { type: 'offer', sdp: event.data.sdp },
          })
        }
      } else if (event.data.type === 'gu:webrtc:ice-candidate') {
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:signal', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            signal: { type: 'ice-candidate', candidate: event.data.candidate },
          })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [websiteId])

  useEffect(() => {
    if (!isInitialized || !visitorTokenRef.current) return

    const socket = retainSocket()
    // No socket server configured (e.g. Vercel) → rely on REST polling.
    if (!socket) {
      return () => { releaseSocket() }
    }

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('visitor:auth', {
        visitorToken: visitorTokenRef.current,
        websiteId,
        conversationId: conversationId || undefined,
      })
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('visitor:typing', (data: { agentName: string }) => {
      setIsTyping(true)
    })

    socket.on('visitor:typing:stop', () => {
      setIsTyping(false)
    })

    socket.on('visitor:screen:start', () => {
      window.parent.postMessage({ type: 'gu:startScreenCapture' }, '*')
    })

    socket.on('visitor:screen:stop', () => {
      window.parent.postMessage({ type: 'gu:stopScreenCapture' }, '*')
    })

    socket.on('visitor:remote-click', (data: { x: number; y: number }) => {
      window.parent.postMessage({ type: 'gu:remote-click', x: data.x, y: data.y }, '*')
    })

    socket.on('visitor:remote-mousemove', (data: { x: number; y: number }) => {
      window.parent.postMessage({ type: 'gu:remote-mousemove', x: data.x, y: data.y }, '*')
    })

    socket.on('visitor:remote-scroll', (data: { deltaX: number; deltaY: number }) => {
      window.parent.postMessage({ type: 'gu:remote-scroll', deltaX: data.deltaX, deltaY: data.deltaY }, '*')
    })

    socket.on('visitor:remote-keydown', (data) => {
      window.parent.postMessage({ type: 'gu:remote-keydown', ...data }, '*')
    })

    socket.on('visitor:remote-keyup', (data) => {
      window.parent.postMessage({ type: 'gu:remote-keyup', ...data }, '*')
    })

    socket.on('visitor:webrtc:start', (data: { agentId: string }) => {
      window.parent.postMessage({ type: 'gu:webrtc:start', agentId: data.agentId }, '*')
    })

    socket.on('visitor:webrtc:stop', () => {
      window.parent.postMessage({ type: 'gu:webrtc:stop' }, '*')
    })

    socket.on('visitor:webrtc:signal', (data: { signal: { type: string; sdp?: string; candidate?: any } }) => {
      if (data.signal.type === 'answer') {
        window.parent.postMessage({ type: 'gu:webrtc:answer', sdp: data.signal.sdp }, '*')
      } else if (data.signal.type === 'ice-candidate') {
        window.parent.postMessage({ type: 'gu:webrtc:ice-candidate', candidate: data.signal.candidate }, '*')
      }
    })

    socket.on('visitor:message', (data: { id: string; content: string; senderType: string; senderName?: string; createdAt: string }) => {
      if (data.senderType === 'AGENT' || data.senderType === 'BOT') {
        const newMsg: Message = {
          id: data.id,
          content: data.content,
          type: 'TEXT',
          senderType: data.senderType as 'AGENT' | 'BOT',
          senderName: data.senderName,
          createdAt: data.createdAt,
        }
        setMessages((prev) => {
          if (prev.some(m => m.id === data.id)) return prev
          return [...prev, newMsg]
        })
        setIsTyping(false)
      }
    })

    socket.on('conversation:status-changed', (data: { conversationId: string; status: string }) => {
      setConversationStatus(data.status)
    })

    return () => {
      releaseSocket()
    }
  }, [isInitialized, websiteId, conversationId])

  // Join conversation room when conversationId is set
  useEffect(() => {
    if (!conversationId) return

    const socket = getSocket() || connectSocket()
    if (!socket) return
    const join = () => {
      socket.emit('visitor:join-conversation', { conversationId })
    }

    if (socket.connected) {
      join()
    } else {
      socket.on('connect', join)
    }

    return () => {
      socket.off('connect', join)
    }
  }, [conversationId])

  // REST polling fallback: pull conversation messages (~2s) whenever a live
  // socket isn't carrying updates. Idempotent merge by id prevents duplicates
  // when socket + polling briefly overlap.
  useEffect(() => {
    if (!conversationId) return
    if (isSocketEnabled() && socketConnected) return

    let active = true

    const poll = async () => {
      if (document.hidden) return
      try {
        const fp = getFingerprint()
        const res = await fetch(
          `/api/widget/messages?conversationId=${encodeURIComponent(conversationId)}&fingerprint=${encodeURIComponent(fp)}&websiteId=${encodeURIComponent(websiteId)}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (!active) return

        if (Array.isArray(data.messages)) {
          const incoming: Message[] = data.messages.map((m: {
            id: string
            content: string
            type: string
            senderType: string
            senderName?: string | null
            createdAt: string
            attachments?: Attachment[]
          }) => ({
            id: m.id,
            content: m.content,
            type: m.type || 'TEXT',
            senderType: m.senderType as Message['senderType'],
            senderName: m.senderName || undefined,
            createdAt: m.createdAt,
            attachments: Array.isArray(m.attachments) ? m.attachments : undefined,
          }))
          setMessages((prev) => mergeWidgetMessages(prev, incoming))
        }

        if (data.status) {
          setConversationStatus((prev) => (prev === data.status ? prev : data.status))
        }
      } catch {
        // Silent — polling will retry on the next tick.
      }
    }

    poll()
    const id = setInterval(poll, 2000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [conversationId, socketConnected])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'gu:pageview') {
        const { url, title, referrer } = event.data
        const socket = getSocket()

        if (socket) {
          socket.emit('visitor:pageview', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            url,
            title: title || '',
            referrer: referrer || '',
          })
        } else {
          if (sessionIdRef.current) {
            fetch('/api/widget/session/pageview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sessionIdRef.current, url, title, referrer }),
            }).catch(() => { })
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [websiteId])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMessage])

  useEffect(() => {
    if (!conversationId || !showPreChat) return
    const socket = getSocket()
    if (!socket?.connected) return

    if (inputMessage.trim()) {
      const now = Date.now()
      if (now - lastTypingEmitRef.current > 300) {
        lastTypingEmitRef.current = now
        socket.emit('visitor:typing', {
          conversationId,
          visitorId: '',
          content: inputMessage,
        })
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        socket.emit('visitor:typing', {
          conversationId,
          visitorId: '',
          content: inputMessage,
        })
        lastTypingEmitRef.current = Date.now()
      }, 300)
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
      socket.emit('visitor:typing:stop', { conversationId, visitorId: '' })
    }

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [inputMessage, conversationId, showPreChat])

  const sendResizeToParent = (open: boolean) => {
    window.parent.postMessage({ type: 'gu:resize', open }, '*')
  }

  const getFingerprint = (): string => {
    let fp = localStorage.getItem('gu_vid')
    if (!fp) {
      fp = crypto.randomUUID()
      localStorage.setItem('gu_vid', fp)
    }
    return fp
  }

  const EMOJIS = ['😀','😃','😄','😁','😅','😂','🤣','😊','😍','🥰','😘','😗','😋','😛','😜','🤪','😎','🤓','🥳','🥺','😢','😭','😤','😡','🥶','🤯','😴','🤔','🙄','😏','😒','😌','😉','🙂','😇','🤗','👍','🔥','💜','✨']

  const GIF_LABELS = ['Merhaba 👋', 'Teşekkürler 🙏', 'Harika! 🎉', 'Anladım 👍', 'Üzgünüm 😔', 'Tamam ✅']

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
      if (
        showGifPicker &&
        gifPickerRef.current &&
        !gifPickerRef.current.contains(e.target as Node) &&
        gifBtnRef.current &&
        !gifBtnRef.current.contains(e.target as Node)
      ) {
        setShowGifPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showEmojiPicker, showGifPicker])

  const handleInsertEmoji = (emoji: string) => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? inputMessage.length
    const end = el.selectionEnd ?? inputMessage.length
    const newVal = inputMessage.slice(0, start) + emoji + inputMessage.slice(end)
    setInputMessage(newVal)
    el.focus()
    setTimeout(() => {
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    }, 0)
  }

  const handleGifClick = (label: string) => {
    setInputMessage(label)
    setShowGifPicker(false)
    setTimeout(() => handleStartChat(), 50)
  }

  const handleOpenKB = async () => {
    setShowKnowledgeBase(true)
    if (kbArticles.length > 0) return
    setKbLoading(true)
    try {
      const res = await fetch(`/api/knowledge/articles?websiteId=${websiteId}&status=PUBLISHED`)
      const data = await res.json()
      setKbArticles(Array.isArray(data) ? data : data.articles || [])
    } catch (err) {
      console.error('[Gu Widget] KB fetch failed:', err)
    } finally {
      setKbLoading(false)
    }
  }

  const handleStartChat = useCallback(async () => {
    if (!inputMessage.trim()) return

    const tempId = `temp_${Date.now()}`
    const newMessage: Message = {
      id: tempId,
      content: inputMessage,
      type: 'TEXT',
      senderType: 'VISITOR',
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputMessage('')

    const socket = getSocket()
    if (socket?.connected && conversationId) {
      socket.emit('visitor:typing:stop', { conversationId, visitorId: '' })
    }

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          conversationId,
          content: inputMessage,
          type: 'TEXT',
          visitorName: visitorInfo.name,
          visitorEmail: visitorInfo.email,
          fingerprint: getFingerprint(),
        }),
      })

      const data = await res.json()
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }
    } catch (error) {
      console.error('[Gu Widget] Send message failed:', error)
    }
  }, [inputMessage, websiteId, conversationId, visitorInfo])

  const handlePickFile = () => {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input so the same file can be re-selected later.
    if (e.target) e.target.value = ''
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(t.fileTooLarge)
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('websiteId', websiteId)

      const upRes = await fetch('/api/widget/upload', { method: 'POST', body: fd })
      const upData = await upRes.json()
      if (!upRes.ok || !upData.url) {
        setUploadError(upData.error || t.uploadError)
        return
      }

      const attachment: Attachment = {
        url: upData.url,
        fileName: upData.fileName || file.name,
        fileSize: upData.fileSize ?? file.size,
        mimeType: upData.mimeType ?? file.type,
      }
      const isImg = isImageAttachment(attachment)
      const caption = inputMessage.trim()
      // content drives the optimistic/server dedupe key — keep it stable.
      const content = caption || (isImg ? `🖼️ ${attachment.fileName}` : `📎 ${attachment.fileName}`)
      const msgType = isImg ? 'IMAGE' : 'FILE'

      const tempId = `temp_${Date.now()}`
      const optimistic: Message = {
        id: tempId,
        content,
        type: msgType,
        senderType: 'VISITOR',
        createdAt: new Date().toISOString(),
        attachments: [attachment],
      }
      setMessages((prev) => [...prev, optimistic])
      setInputMessage('')

      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          conversationId,
          content,
          type: msgType,
          visitorName: visitorInfo.name,
          visitorEmail: visitorInfo.email,
          fingerprint: getFingerprint(),
          attachment,
        }),
      })
      const data = await res.json()
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }
    } catch (error) {
      console.error('[Gu Widget] File upload failed:', error)
      setUploadError(t.uploadError)
    } finally {
      setUploading(false)
    }
  }, [websiteId, conversationId, visitorInfo, inputMessage, t])

  const handleTranslateMessage = useCallback(async (msg: Message) => {
    if (translations[msg.id]) {
      // Toggle off — show original.
      setTranslations((prev) => {
        const next = { ...prev }
        delete next[msg.id]
        return next
      })
      return
    }
    if (!msg.content?.trim()) return
    setTranslatingId(msg.id)
    try {
      const res = await fetch('/api/widget/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          text: msg.content,
          targetLang: lang,
        }),
      })
      const data = await res.json()
      if (data.available && data.translatedText) {
        setTranslations((prev) => ({ ...prev, [msg.id]: data.translatedText }))
      } else if (data.available === false) {
        // No engine configured — hide the feature going forward.
        setAiTranslateAvailable(false)
      }
    } catch {
      // Silent — never break the chat over a translation hiccup.
    } finally {
      setTranslatingId(null)
    }
  }, [translations, websiteId, lang])

  const primaryColor = config?.primaryColor || '#1972F5'
  const agentsOnline = config?.agentsOnline ?? 3
  const agentName = config?.websiteName || 'Destek'
  const agentInitials = getInitials(agentName)
  const agentAvatar = config?.avatarUrl || null

  const renderAttachments = (msg: Message, onDark: boolean) => {
    if (!msg.attachments || msg.attachments.length === 0) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
        {msg.attachments.map((att, i) => {
          if (isImageAttachment(att)) {
            return (
              <a key={att.id || i} href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', lineHeight: 0 }}>
                <img
                  src={att.url}
                  alt={att.fileName}
                  style={{
                    maxWidth: '220px',
                    maxHeight: '200px',
                    width: 'auto',
                    borderRadius: '12px',
                    border: onDark ? '1px solid rgba(255,255,255,0.25)' : '1px solid #E5E7EB',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </a>
            )
          }
          return (
            <a
              key={att.id || i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              download={att.fileName}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                background: onDark ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                borderRadius: '12px',
                padding: '10px 12px',
                maxWidth: '230px',
              }}
            >
              <div style={{
                width: '34px', height: '34px', flexShrink: 0, borderRadius: '9px',
                background: onDark ? 'rgba(255,255,255,0.2)' : '#E0E7FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={onDark ? '#fff' : primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: onDark ? '#fff' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.fileName}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: onDark ? 'rgba(255,255,255,0.8)' : '#76728A' }}>
                  {formatBytes(att.fileSize)}{att.fileSize ? ' • ' : ''}{t.download}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    )
  }

  if (!isInitialized || !config) {
    const loadingWidget = (
      <div style={{ width: '100vw', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(25,114,245,0.15)', borderTopColor: '#1972F5', borderRadius: '50%', animation: 'gwSpin 0.8s linear infinite' }} />
        <style>{`@keyframes gwSpin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
    if (typeof window !== 'undefined' && mounted) {
      return createPortal(loadingWidget, document.body)
    }
    return loadingWidget
  }

  const avatarEl = (size: number) => (
    agentAvatar
      ? <img src={agentAvatar} alt={agentName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      : <span style={{ fontSize: size * 0.38, fontWeight: 700, color: 'white', letterSpacing: '-0.5px', userSelect: 'none' }}>{agentInitials || '?'}</span>
  )

  const mainWidget = (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      color: '#0F172A',
      colorScheme: 'light',
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 2147483645,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}>
      <style>{`
        @keyframes gwSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes gwFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes gwBounce {
          0%, 60%, 100% { transform: translateY(0);    }
          30%            { transform: translateY(-5px); }
        }
        @keyframes gwCheckIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2);            }
          100% { transform: scale(1); opacity: 1;  }
        }
        @keyframes gwSpin { to { transform: rotate(360deg); } }
        @keyframes gwPop {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1);    }
        }
        .gw-scroll::-webkit-scrollbar       { width: 3px; }
        .gw-scroll::-webkit-scrollbar-track { background: transparent; }
        .gw-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .gw-input::placeholder { color: #94A3B8 !important; opacity: 1; }
        .gw-msg-btn:hover { opacity: 1 !important; }
        @media (max-width: 480px) {
          .gw-panel   { width: 100vw !important; max-height: 100dvh !important; height: 100dvh !important; border-radius: 0 !important; }
          .gw-wrapper { bottom: 0 !important; right: 0 !important; }
          .gw-button  { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>

      {isOpen ? (
        <div className="gw-panel" style={{
          width: '390px',
          maxHeight: '620px',
          height: 'calc(100dvh - 72px)',
          background: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.14), 0 4px 20px rgba(0,0,0,0.07)',
          animation: 'gwSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* ─── HEADER ─────────────────────────────────────────────────────── */}
          <div style={{
            padding: '18px 18px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #F1F5F9',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -25)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: `0 4px 14px ${primaryColor}40`,
              }}>
                {avatarEl(46)}
              </div>
              <div style={{
                position: 'absolute', bottom: '-1px', right: '-1px',
                width: '13px', height: '13px', borderRadius: '50%',
                background: '#22C55E', border: '2.5px solid white',
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#0F172A', letterSpacing: '-0.02em' }}>
                {agentName}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
                {t.online} · {t.typicalReply}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
                  style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  aria-label="Dil seçin"
                  style={{
                    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                    background: '#F8FAFC', color: '#475569',
                    border: '1px solid #E2E8F0', borderRadius: '10px',
                    padding: '5px 22px 5px 26px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', outline: 'none', maxWidth: '110px', lineHeight: 1.3,
                  }}
                >
                  {WIDGET_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} style={{ color: '#0F172A', background: '#fff' }}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
                  style={{ position: 'absolute', right: '6px', pointerEvents: 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <button
                onClick={() => { setIsOpen(false); sendResizeToParent(false) }}
                aria-label={t.close}
                style={{
                  width: '34px', height: '34px', background: '#F1F5F9',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', transition: 'all 0.15s', flexShrink: 0, lineHeight: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ─── KNOWLEDGE BASE VIEW ─────────────────────────────────────────── */}
          {showKnowledgeBase ? (
            <div className="gw-scroll" style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden',
              padding: '16px', background: '#F8FAFC',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{t.help}</p>
                <button
                  onClick={() => { setShowKnowledgeBase(false); setSelectedArticle(null) }}
                  style={{
                    background: '#E2E8F0', border: 'none', borderRadius: '8px',
                    padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
                    color: '#64748B', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#CBD5E1' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#E2E8F0' }}
                >
                  {t.backToChat}
                </button>
              </div>
              {kbLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8', fontSize: '14px' }}>{t.loading}</div>
              ) : selectedArticle ? (
                <div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    style={{
                      background: 'none', border: 'none', padding: '4px 0 14px',
                      cursor: 'pointer', color: primaryColor, fontWeight: 600,
                      fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'inherit',
                    }}
                  >{t.back}</button>
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#0F172A', lineHeight: 1.4 }}>{selectedArticle.title}</h3>
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedArticle.content}</div>
                </div>
              ) : kbArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8', fontSize: '14px' }}>{t.noArticles}</div>
              ) : (
                kbArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    style={{
                      background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px',
                      padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', fontFamily: 'inherit', width: '100%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.boxShadow = `0 2px 12px ${primaryColor}18` }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{article.title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                      {article.content?.slice(0, 90)}{article.content?.length > 90 ? '...' : ''}
                    </p>
                  </button>
                ))
              )}
            </div>

          ) : (
            <>
              {/* ─── PROACTIVE BANNER ───────────────────────────────────────── */}
              {proactiveMessage && (
                <div style={{
                  background: primaryColor,
                  padding: '10px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  flexShrink: 0,
                  animation: 'gwSlideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff' }}>{proactiveMessage.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{proactiveMessage.message}</p>
                  </div>
                  <button
                    onClick={() => setProactiveMessage(null)}
                    style={{
                      background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
                      padding: '3px 10px', color: '#fff', fontSize: '11px',
                      cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >{t.close}</button>
                </div>
              )}

              {/* ─── MESSAGES AREA ──────────────────────────────────────────── */}
              <div className="gw-scroll" style={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden',
                padding: '20px 16px 8px',
                display: 'flex', flexDirection: 'column', gap: '4px',
                background: '#F8FAFC',
              }}>
                {/* Date pill */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', color: '#94A3B8',
                    background: '#E2E8F0', padding: '3px 12px',
                    borderRadius: '20px', fontWeight: 600,
                  }}>{t.today}</span>
                </div>

                {/* Welcome bubble */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '4px', animation: 'gwFadeIn 0.3s ease-out' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -25)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', boxShadow: `0 2px 8px ${primaryColor}30`,
                  }}>
                    {avatarEl(32)}
                  </div>
                  <div style={{ maxWidth: '280px' }}>
                    <p style={{ margin: '0 0 4px 2px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                      {agentName}
                    </p>
                    <div style={{
                      background: '#ffffff', borderRadius: '4px 16px 16px 16px',
                      padding: '12px 16px',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', lineHeight: 1.65 }}>
                        {config.welcomeMessage || t.welcomeFallback}
                      </p>
                    </div>
                    <p style={{ margin: '4px 0 0 2px', fontSize: '10px', color: '#CBD5E1' }}>
                      {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Quick-reply chips */}
                {messages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', marginLeft: '42px' }}>
                    {[
                      { key: 'chat', label: t.quickChat },
                      { key: 'pricing', label: t.quickPricing },
                      { key: 'support', label: t.quickSupport },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (key === 'chat' && visitorInfo.name && visitorInfo.email) {
                            setShowPreChat(false)
                            setTimeout(() => inputRef.current?.focus(), 80)
                          }
                          setInputMessage(label.replace(/^[\S]+\s/, ''))
                          inputRef.current?.focus()
                        }}
                        style={{
                          background: '#ffffff', border: `1.5px solid ${primaryColor}22`,
                          borderRadius: '22px', padding: '8px 16px',
                          fontSize: '13px', color: '#334155',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s', fontWeight: 500,
                          maxWidth: 'fit-content', fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = primaryColor
                          e.currentTarget.style.background = `${primaryColor}08`
                          e.currentTarget.style.color = '#0F172A'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${primaryColor}22`
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.color = '#334155'
                        }}
                      >{label}</button>
                    ))}
                  </div>
                )}

                {/* Message list */}
                {messages.map((msg, idx) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', marginTop: '6px', animation: 'gwFadeIn 0.25s ease-out' }}>
                    {msg.senderType === 'VISITOR' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ maxWidth: '280px' }}>
                          {!(msg.attachments?.length && /^(🖼️|📎)\s/u.test(msg.content)) && (
                            <div style={{
                              background: primaryColor,
                              color: '#ffffff',
                              borderRadius: '16px 4px 16px 16px',
                              padding: '11px 16px',
                              fontSize: '14px', lineHeight: 1.65,
                              boxShadow: `0 2px 10px ${primaryColor}35`,
                            }}>
                              {msg.content}
                            </div>
                          )}
                          {renderAttachments(msg, true)}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', margin: '4px 2px 0 0' }}>
                            <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{formatTime(msg.createdAt)}</span>
                            {idx === messages.length - 1 && (
                              <svg width="13" height="13" viewBox="0 0 13 13" style={{ animation: 'gwCheckIn 0.3s ease-out' }}>
                                <path d="M2 7l3 3 6-6" stroke={primaryColor} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                          background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -25)})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          {avatarEl(30)}
                        </div>
                        <div style={{ maxWidth: '280px' }}>
                          {msg.senderName && (
                            <p style={{ margin: '0 0 4px 2px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                              {msg.senderName}
                            </p>
                          )}
                          <div style={{
                            background: '#ffffff',
                            borderRadius: '4px 16px 16px 16px',
                            padding: '11px 16px',
                            fontSize: '14px', lineHeight: 1.65, color: '#0F172A',
                            boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
                          }}>
                            {msg.content}
                            {translations[msg.id] && (
                              <span style={{
                                display: 'block', marginTop: '8px', paddingTop: '8px',
                                borderTop: '1px solid #F1F5F9',
                                fontSize: '13px', color: '#475569', fontStyle: 'italic', lineHeight: 1.5,
                              }}>
                                <span style={{ fontSize: '12px' }}>🌐</span> {translations[msg.id]}
                              </span>
                            )}
                          </div>
                          {renderAttachments(msg, false)}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 0 2px' }}>
                            <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{formatTime(msg.createdAt)}</span>
                            {aiTranslateAvailable && msg.content?.trim() && (
                              <button
                                className="gw-msg-btn"
                                onClick={() => handleTranslateMessage(msg)}
                                disabled={translatingId === msg.id}
                                aria-label={translations[msg.id] ? t.showOriginal : t.translate}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  padding: 0, fontSize: '10px', fontWeight: 600,
                                  color: translations[msg.id] ? primaryColor : '#94A3B8',
                                  display: 'flex', alignItems: 'center', gap: '3px',
                                  fontFamily: 'inherit', lineHeight: 1, opacity: 0.7,
                                  transition: 'opacity 0.15s',
                                }}
                              >
                                <span style={{ fontSize: '11px' }}>🌐</span>
                                {translatingId === msg.id ? t.translating : (translations[msg.id] ? t.showOriginal : t.translate)}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '6px', animation: 'gwFadeIn 0.2s ease-out' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                      background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -25)})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {avatarEl(30)}
                    </div>
                    <div style={{
                      background: '#ffffff', borderRadius: '4px 16px 16px 16px',
                      padding: '14px 18px',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                    }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <span key={i} style={{
                            width: '7px', height: '7px',
                            background: '#94A3B8', borderRadius: '50%',
                            display: 'inline-block',
                            animation: `gwBounce 1.2s ${delay}s infinite ease-in-out`,
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating form */}
                {(conversationStatus === 'RESOLVED' || conversationStatus === 'CLOSED') && messages.length > 0 && !ratingSubmitted && (
                  <div style={{
                    marginTop: '20px', padding: '20px 16px',
                    background: '#ffffff', borderRadius: '16px',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                    textAlign: 'center', animation: 'gwFadeIn 0.3s ease-out',
                  }}>
                    <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{t.rateChat}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                            fontSize: '26px', lineHeight: 1, transition: 'transform 0.15s',
                            filter: star <= rating ? 'none' : 'grayscale(1)',
                            opacity: star <= rating ? 1 : 0.25,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                        >★</button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      style={{
                        width: '100%', padding: '10px 14px',
                        border: '1.5px solid #E2E8F0', borderRadius: '12px',
                        fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                        boxSizing: 'border-box', background: '#F8FAFC', color: '#0F172A', marginBottom: '10px',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0' }}
                    />
                    <button
                      onClick={async () => {
                        if (rating === 0 || ratingSending) return
                        setRatingSending(true)
                        try {
                          await fetch('/api/ratings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ conversationId, rating, comment: ratingComment || null }),
                          })
                          setRatingSubmitted(true)
                        } catch { /* silent */ } finally {
                          setRatingSending(false)
                        }
                      }}
                      style={{
                        width: '100%', padding: '11px',
                        background: rating === 0 ? '#E2E8F0' : primaryColor,
                        color: rating === 0 ? '#94A3B8' : '#fff',
                        border: 'none', borderRadius: '12px',
                        fontSize: '14px', fontWeight: 600, cursor: rating === 0 ? 'default' : 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >{ratingSending ? t.sending : t.send}</button>
                  </div>
                )}
                {ratingSubmitted && (
                  <div style={{ marginTop: '16px', textAlign: 'center', animation: 'gwFadeIn 0.3s ease-out', padding: '16px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{t.thanksRating}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>{t.thanksRatingSub}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </>
          )}

          {/* ─── PRE-CHAT FORM ───────────────────────────────────────────────── */}
          {!showKnowledgeBase && showPreChat && (
            <div style={{
              padding: '20px 20px 16px',
              borderTop: '1px solid #F1F5F9',
              background: '#ffffff', flexShrink: 0,
            }}>
              <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{t.preChatHi}</p>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{t.preChatSub}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input type="text" placeholder={t.namePlaceholder} value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px',
                      border: '1.5px solid #E2E8F0', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F8FAFC', color: '#0F172A', transition: 'all 0.15s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18` }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input type="email" placeholder={t.emailPlaceholder} value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px',
                      border: '1.5px solid #E2E8F0', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F8FAFC', color: '#0F172A', transition: 'all 0.15s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18` }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (visitorInfo.name && visitorInfo.email) {
                      setShowPreChat(false)
                      setTimeout(() => inputRef.current?.focus(), 80)
                    }
                  }}
                  style={{
                    width: '100%', padding: '12px',
                    background: visitorInfo.name && visitorInfo.email ? primaryColor : '#E2E8F0',
                    color: visitorInfo.name && visitorInfo.email ? '#fff' : '#94A3B8',
                    border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    boxShadow: visitorInfo.name && visitorInfo.email ? `0 4px 14px ${primaryColor}35` : 'none',
                  }}
                  onMouseEnter={(e) => { if (visitorInfo.name && visitorInfo.email) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${primaryColor}45` } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = visitorInfo.name && visitorInfo.email ? `0 4px 14px ${primaryColor}35` : 'none' }}
                >
                  {t.startChat}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '11px', color: '#CBD5E1', fontWeight: 500 }}>{t.sslNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── MESSAGE INPUT ───────────────────────────────────────────────── */}
          {!showKnowledgeBase && !showPreChat && (
            <div style={{
              padding: '10px 14px 12px',
              borderTop: '1px solid #F1F5F9',
              background: '#ffffff', flexShrink: 0, position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} style={{
                    position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px',
                    background: '#fff', borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(15,23,42,0.14)',
                    padding: '10px', zIndex: 2147483646,
                    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px', width: '236px',
                  }}>
                    {EMOJIS.map((emoji) => (
                      <button key={emoji} onClick={() => handleInsertEmoji(emoji)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '21px', padding: '5px', lineHeight: 1,
                          borderRadius: '8px', transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.background = '#F1F5F9' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none' }}
                      >{emoji}</button>
                    ))}
                  </div>
                )}
                {showGifPicker && (
                  <div ref={gifPickerRef} style={{
                    position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px',
                    background: '#fff', borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(15,23,42,0.14)',
                    padding: '8px', zIndex: 2147483646,
                    display: 'flex', flexDirection: 'column', gap: '4px', width: '210px',
                  }}>
                    {GIF_LABELS.map((label) => (
                      <button key={label} onClick={() => handleGifClick(label)}
                        style={{
                          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                          padding: '9px 14px', cursor: 'pointer', fontSize: '13px',
                          textAlign: 'left', fontFamily: 'inherit', color: '#0F172A', transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = `${primaryColor}08` }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
                      >{label}</button>
                    ))}
                  </div>
                )}

                <button ref={emojiBtnRef}
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false) }}
                  style={{
                    width: '34px', height: '34px',
                    background: showEmojiPicker ? '#F1F5F9' : 'transparent',
                    border: 'none', borderRadius: '9px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '18px', lineHeight: 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!showEmojiPicker) e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { if (!showEmojiPicker) e.currentTarget.style.background = 'transparent' }}
                >😊</button>

                <button ref={gifBtnRef}
                  onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false) }}
                  style={{
                    width: '34px', height: '34px',
                    background: showGifPicker ? '#F1F5F9' : 'transparent',
                    border: 'none', borderRadius: '9px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '17px', lineHeight: 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!showGifPicker) e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { if (!showGifPicker) e.currentTarget.style.background = 'transparent' }}
                >🎬</button>

                <input ref={fileInputRef} type="file" accept={ACCEPTED_UPLOAD} onChange={handleFileSelected}
                  style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
                <button
                  onClick={handlePickFile} disabled={uploading} aria-label={t.attachFile}
                  style={{
                    width: '34px', height: '34px', background: 'transparent',
                    border: 'none', borderRadius: '9px',
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 0, color: '#94A3B8', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569' } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
                >
                  {uploading
                    ? <span style={{ width: '16px', height: '16px', border: `2px solid ${primaryColor}30`, borderTopColor: primaryColor, borderRadius: '50%', animation: 'gwSpin 0.8s linear infinite', display: 'inline-block' }} />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>}
                </button>

                <textarea
                  ref={inputRef} value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStartChat() } }}
                  placeholder={t.inputPlaceholder} rows={1} className="gw-input"
                  style={{
                    flex: 1, padding: '9px 14px',
                    border: '1.5px solid #E2E8F0', borderRadius: '14px',
                    fontSize: '14px', resize: 'none', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.55, boxSizing: 'border-box',
                    background: '#F8FAFC', color: '#0F172A',
                    transition: 'all 0.15s', maxHeight: '120px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none' }}
                />

                <button
                  onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); if (!showKnowledgeBase) handleOpenKB(); else { setShowKnowledgeBase(false); setSelectedArticle(null) } }}
                  style={{
                    width: '34px', height: '34px',
                    background: showKnowledgeBase ? '#F1F5F9' : 'transparent',
                    border: 'none', borderRadius: '9px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '17px', lineHeight: 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!showKnowledgeBase) e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { if (!showKnowledgeBase) e.currentTarget.style.background = 'transparent' }}
                >📚</button>

                <button
                  onClick={handleStartChat} disabled={!inputMessage.trim()}
                  style={{
                    width: '36px', height: '36px',
                    background: inputMessage.trim() ? primaryColor : '#E2E8F0',
                    color: inputMessage.trim() ? '#fff' : '#94A3B8',
                    border: 'none', borderRadius: '11px',
                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                    boxShadow: inputMessage.trim() ? `0 2px 10px ${primaryColor}40` : 'none',
                  }}
                  onMouseEnter={(e) => { if (inputMessage.trim()) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 4px 16px ${primaryColor}50` } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = inputMessage.trim() ? `0 2px 10px ${primaryColor}40` : 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {uploadError && (
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#EF4444', fontWeight: 500 }}>{uploadError}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '8px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
                <p style={{ margin: 0, fontSize: '10px', color: '#CBD5E1', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {t.poweredBy}
                </p>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ─── FLOATING BUTTON ─────────────────────────────────────────────── */
        <button
          onClick={() => { setIsOpen(true); sendResizeToParent(true) }}
          className="gw-button"
          style={{
            width: '58px', height: '58px', borderRadius: '18px',
            background: primaryColor,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 28px ${primaryColor}50`,
            animation: 'gwPop 3s ease-in-out infinite',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08) rotate(-4deg)'; e.currentTarget.style.boxShadow = `0 12px 36px ${primaryColor}65` }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.boxShadow = `0 8px 28px ${primaryColor}50` }}
        >
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  )

  if (typeof window !== 'undefined' && mounted) {
    return createPortal(mainWidget, document.body)
  }
  return mainWidget
}

function adjustColor(hex: string, amount: number): string {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const num = parseInt(hex, 16)
  let r = Math.min(255, Math.max(0, (num >> 16) + amount))
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}
