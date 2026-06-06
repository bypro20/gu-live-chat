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
  agentsOnline: number
}

interface Message {
  id: string
  content: string
  type: string
  senderType: 'VISITOR' | 'AGENT' | 'BOT' | 'SYSTEM'
  senderName?: string
  createdAt: string
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

const AGENT = {
  name: 'Elif',
  role: 'Destek',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face&q=80',
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
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
            agentsOnline: 1,
          })
          setIsInitialized(true)
          return
        }

        setConfig(data.websiteConfig)
        setConversationId(data.conversationId)
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
          `/api/widget/messages?conversationId=${encodeURIComponent(conversationId)}&fingerprint=${encodeURIComponent(fp)}`
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
          }) => ({
            id: m.id,
            content: m.content,
            type: m.type || 'TEXT',
            senderType: m.senderType as Message['senderType'],
            senderName: m.senderName || undefined,
            createdAt: m.createdAt,
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

  const primaryColor = config?.primaryColor || '#1972F5'
  const gradientStart = '#1972F5'
  const gradientEnd = '#3B82F6'
  const agentsOnline = config?.agentsOnline ?? 3

  if (!isInitialized || !config) {
    const loadingWidget = (
      <div style={{ width: '100vw', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '3px solid rgba(25,114,245,0.15)', borderTopColor: gradientStart, borderRadius: '50%', animation: 'gwSpin 0.8s linear infinite' }}></div>
          <style>{`@keyframes gwSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
    if (typeof window !== 'undefined' && mounted) {
      return createPortal(loadingWidget, document.body)
    }
    return loadingWidget
  }

  const mainWidget = (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#111827',
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
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gwFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gwPulse {
          0% { box-shadow: 0 8px 32px rgba(25,114,245,0.35); }
          50% { box-shadow: 0 8px 48px rgba(25,114,245,0.55); }
          100% { box-shadow: 0 8px 32px rgba(25,114,245,0.35); }
        }
        @keyframes gwBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes gwRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes gwCheckIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        .gw-scroll::-webkit-scrollbar { width: 4px; }
        .gw-scroll::-webkit-scrollbar-track { background: transparent; }
        .gw-scroll::-webkit-scrollbar-thumb { background: #DDDCE5; border-radius: 4px; }
        .gw-scroll::-webkit-scrollbar-thumb:hover { background: #C5C5D5; }
        .gw-input::placeholder { color: #B0B0C5 !important; opacity: 1; }
        @media (max-width: 480px) {
          .gw-panel { width: 100vw !important; max-height: 100dvh !important; height: 100dvh !important; border-radius: 0 !important; bottom: 0 !important; right: 0 !important; }
          .gw-wrapper { bottom: 0 !important; right: 0 !important; padding: 0 !important; }
          .gw-button { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>

      {isOpen ? (
        <div className="gw-panel" style={{
          width: '380px',
          maxHeight: '600px',
          height: 'calc(100dvh - 80px)',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          animation: 'gwSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}>
          <div style={{
            background: primaryColor,
            padding: '20px 20px 16px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', top: '6px', right: '70px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img src={AGENT.photo} alt={AGENT.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E', border: '2px solid white', zIndex: 2 }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, letterSpacing: '-0.01em' }}>{AGENT.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: '2px 0 0', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#86efac' }} />
                  Çevrimiçi • Tipik yanıt: 2 dk
                </p>
              </div>
              <button
                onClick={() => { setIsOpen(false); sendResizeToParent(false) }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '7px',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  lineHeight: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {showKnowledgeBase ? (
            <div className="gw-scroll" style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden',
              padding: '16px', background: '#F9FAFB',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#111827' }}>📚 Yardım</p>
                <button
                  onClick={() => { setShowKnowledgeBase(false); setSelectedArticle(null) }}
                  style={{
                    background: '#F3F4F6', border: 'none', borderRadius: '10px',
                    padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
                    color: '#76728A', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E0DFEF' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6' }}
                >
                  Sohbete Dön
                </button>
              </div>
              {kbLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#76728A', fontSize: '14px' }}>Yükleniyor...</div>
              ) : selectedArticle ? (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    style={{
                      background: 'none', border: 'none', padding: '4px 0 12px',
                      cursor: 'pointer', color: '#1972F5', fontWeight: 600,
                      fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'inherit',
                    }}
                  >
                    ← Geri
                  </button>
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#111827', lineHeight: '1.4' }}>{selectedArticle.title}</h3>
                  <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedArticle.content}</div>
                </div>
              ) : kbArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#76728A', fontSize: '14px' }}>
                  Henüz yardım makalesi bulunmuyor.
                </div>
              ) : (
                kbArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    style={{
                      background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px',
                      padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1972F5'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,114,245,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#111827' }}>{article.title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#76728A' }}>
                      {article.content?.slice(0, 80)}{article.content?.length > 80 ? '...' : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
            {proactiveMessage && (
              <div style={{
                background: '#1972F5',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                flexShrink: 0,
                animation: 'gwSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'white' }}>{proactiveMessage.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4' }}>{proactiveMessage.message}</p>
                </div>
                <button
                  onClick={() => setProactiveMessage(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Kapat
                </button>
              </div>
            )}
          <div className="gw-scroll" style={{
            flex: 1,
            overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: '#F9FAFB',
            }}>
              <div style={{ textAlign: 'center', margin: '0 0 12px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '11px',
                  color: '#76728A',
                  background: '#F3F4F6',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  Bugün
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '4px', animation: 'gwFadeIn 0.3s ease-out' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid #E5E7EB',
                }}>
                  <img
                    src={AGENT.photo}
                    alt={AGENT.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ maxWidth: '270px' }}>
                  <p style={{ margin: '0 0 3px 4px', fontSize: '11px', fontWeight: 600, color: '#76728A' }}>
                    {AGENT.name}
                  </p>
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '12px 16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827', lineHeight: '1.6' }}>
                      {config.welcomeMessage || 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?'}
                    </p>
                  </div>
                  <p style={{ margin: '4px 0 0 4px', fontSize: '10px', color: '#B0B0C5', fontWeight: 500 }}>
                    {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', marginLeft: '40px' }}>
                  {['💬 Sohbet başlat', '💰 Fiyatlandırma', '🛠️ Destek talebi'].map((text) => (
                    <button
                      key={text}
                      onClick={() => {
                        if (text.includes('Sohbet')) {
                          if (visitorInfo.name && visitorInfo.email) {
                            setShowPreChat(false)
                            setTimeout(() => inputRef.current?.focus(), 100)
                          }
                        }
                        setInputMessage(text.replace(/^[^\s]+\s/, ''))
                        inputRef.current?.focus()
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(25,114,245,0.12)',
                        borderRadius: '20px',
                        padding: '9px 16px',
                        fontSize: '13px',
                        color: '#111827',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontWeight: 500,
                        maxWidth: 'fit-content',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1972F5'
                        e.currentTarget.style.background = 'rgba(25,114,245,0.04)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(25,114,245,0.12)'
                        e.currentTarget.style.background = '#ffffff'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '2px',
                  animation: 'gwFadeIn 0.3s ease-out',
                }}>
                  {msg.senderType === 'VISITOR' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '270px' }}>
                        <div style={{
                          background: '#1972F5',
                          color: 'white',
                          borderRadius: '12px 12px 4px 12px',
                          padding: '11px 16px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          boxShadow: '0 2px 8px rgba(25,114,245,0.25)',
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', margin: '4px 4px 0 0' }}>
                          <span style={{ fontSize: '10px', color: '#B0B0C5', fontWeight: 500 }}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {idx === messages.length - 1 && (
                            <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'gwCheckIn 0.3s ease-out' }}>
                              <path d="M3 6l2 2 4-4" stroke="#1972F5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '2px solid #E5E7EB',
                      }}>
                        <img
                          src={AGENT.photo}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ maxWidth: '270px' }}>
                        {msg.senderName && (
                          <p style={{ margin: '0 0 3px 4px', fontSize: '11px', fontWeight: 600, color: '#76728A' }}>{msg.senderName}</p>
                        )}
                        <div style={{
                          background: '#ffffff',
                          borderRadius: '12px 12px 12px 4px',
                          padding: '11px 16px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#111827',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}>
                          {msg.content}
                        </div>
                        <p style={{ margin: '4px 0 0 4px', fontSize: '10px', color: '#B0B0C5', fontWeight: 500 }}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px', animation: 'gwFadeIn 0.2s ease-out' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '2px solid #E5E7EB',
                  }}>
                    <img src={AGENT.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '14px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{ width: '7px', height: '7px', background: '#76728A', borderRadius: '50%', animation: 'gwBounce 1.4s infinite ease-in-out' }}></span>
                      <span style={{ width: '7px', height: '7px', background: '#76728A', borderRadius: '50%', animation: 'gwBounce 1.4s infinite ease-in-out 0.2s' }}></span>
                      <span style={{ width: '7px', height: '7px', background: '#76728A', borderRadius: '50%', animation: 'gwBounce 1.4s infinite ease-in-out 0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              {(conversationStatus === 'RESOLVED' || conversationStatus === 'CLOSED') && messages.length > 0 && !ratingSubmitted && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', textAlign: 'center', animation: 'gwFadeIn 0.3s ease-out' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>Sohbeti değerlendirin</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '10px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={(e) => {
                          const stars = e.currentTarget.parentElement?.children
                          if (stars) {
                            for (let i = 0; i < stars.length; i++) {
                              const s = stars[i] as HTMLElement
                              if (i < star) s.style.transform = 'scale(1.2)'
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stars = e.currentTarget.parentElement?.children
                          if (stars) {
                            for (let i = 0; i < stars.length; i++) {
                              (stars[i] as HTMLElement).style.transform = 'scale(1)'
                            }
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '28px',
                          lineHeight: 1,
                          transition: 'transform 0.15s ease',
                          filter: star <= rating ? 'none' : 'grayscale(1)',
                          opacity: star <= rating ? 1 : 0.3,
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Yorum ekleyin (isteğe bağlı)..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#111827',
                      marginBottom: '10px',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1972F5' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                  />
                  <button
                    onClick={async () => {
                      if (rating === 0 || ratingSending) return
                      setRatingSending(true)
                      try {
                        await fetch('/api/ratings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            conversationId,
                            rating,
                            comment: ratingComment || null,
                          }),
                        })
                        setRatingSubmitted(true)
                      } catch {
                        // silent
                      } finally {
                        setRatingSending(false)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: rating === 0 ? '#E5E7EB' : '#1972F5',
                      color: rating === 0 ? '#B0B0C5' : 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: rating === 0 ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    {ratingSending ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              )}

              {ratingSubmitted && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', textAlign: 'center', animation: 'gwFadeIn 0.3s ease-out' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>Değerlendirmeniz için teşekkür ederiz! 🙏</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#76728A' }}>Görüşleriniz bizim için çok değerli</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            </>
          )}

          {showPreChat ? (
            <div style={{
              padding: '24px 20px 20px',
              borderTop: '1px solid #E5E7EB',
              background: '#ffffff',
              flexShrink: 0,
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '48px', height: '48px', margin: '0 auto 12px',
                  borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid #E5E7EB',
                }}>
                  <img src={AGENT.photo} alt={AGENT.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Merhaba! 👋</p>
                <p style={{ fontSize: '13px', color: '#76728A', margin: 0, lineHeight: '1.5' }}>
                  Sohbete başlamak için bilgilerinizi girin
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '14px', top: '13px', color: '#B0B0C5' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Adınız"
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      border: '1px solid #E5E7EB', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F9FAFB', color: '#111827',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1972F5'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25,114,245,0.12)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '14px', top: '13px', color: '#B0B0C5' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      border: '1px solid #E5E7EB', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F9FAFB', color: '#111827',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1972F5'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25,114,245,0.12)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (visitorInfo.name && visitorInfo.email) {
                      setShowPreChat(false)
                      setTimeout(() => inputRef.current?.focus(), 100)
                    }
                  }}
                  style={{
                    width: '100%', padding: '13px',
                    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    opacity: visitorInfo.name && visitorInfo.email ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (visitorInfo.name && visitorInfo.email) {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(25,114,245,0.35)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Sohbete Başla
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#C5C5D5" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: '#B0B0C5', margin: 0, fontWeight: 500 }}>
                    256-bit SSL ile korunmaktadır
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '12px 16px 14px',
              borderTop: '1px solid #E5E7EB',
              background: '#ffffff',
              flexShrink: 0,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    style={{
                      position: 'absolute', bottom: '100%', left: '0',
                      marginBottom: '8px', background: '#ffffff',
                      borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      padding: '8px', zIndex: 2147483646,
                      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '2px', width: '240px',
                    }}
                  >
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleInsertEmoji(emoji)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '22px', padding: '4px', lineHeight: 1,
                          borderRadius: '6px', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.background = '#F0EFF5' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {showGifPicker && (
                  <div
                    ref={gifPickerRef}
                    style={{
                      position: 'absolute', bottom: '100%', left: '0',
                      marginBottom: '8px', background: '#ffffff',
                      borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      padding: '8px', zIndex: 2147483646,
                      display: 'flex', flexDirection: 'column', gap: '4px',
                      width: '220px',
                    }}
                  >
                    {GIF_LABELS.map((label) => (
                      <button
                        key={label}
                        onClick={() => handleGifClick(label)}
                        style={{
                          background: '#F9FAFB', border: '1px solid #E5E7EB',
                          borderRadius: '10px', padding: '10px 14px',
                          cursor: 'pointer', fontSize: '14px',
                          textAlign: 'left', fontFamily: 'inherit',
                          color: '#111827', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#1972F5' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  ref={emojiBtnRef}
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false) }}
                  style={{
                    width: '36px', height: '36px',
                    background: showEmojiPicker ? '#F0EFF5' : 'transparent',
                    border: 'none', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '18px', lineHeight: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!showEmojiPicker) { e.currentTarget.style.background = '#F0EFF5' } }}
                  onMouseLeave={(e) => { if (!showEmojiPicker) { e.currentTarget.style.background = 'transparent' } }}
                >
                  😊
                </button>
                <button
                  ref={gifBtnRef}
                  onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false) }}
                  style={{
                    width: '36px', height: '36px',
                    background: showGifPicker ? '#F0EFF5' : 'transparent',
                    border: 'none', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '18px', lineHeight: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!showGifPicker) { e.currentTarget.style.background = '#F0EFF5' } }}
                  onMouseLeave={(e) => { if (!showGifPicker) { e.currentTarget.style.background = 'transparent' } }}
                >
                  🎬
                </button>
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleStartChat()
                    }
                  }}
                  placeholder="Mesajınızı yazın..."
                  rows={1}
                  className="gw-input"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                    background: '#F9FAFB',
                    color: '#111827',
                    transition: 'all 0.2s',
                    maxHeight: '120px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1972F5'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25,114,245,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); if (!showKnowledgeBase) handleOpenKB(); else { setShowKnowledgeBase(false); setSelectedArticle(null) } }}
                  style={{
                    width: '36px', height: '36px',
                    background: showKnowledgeBase ? '#F0EFF5' : 'transparent',
                    border: 'none', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '18px', lineHeight: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!showKnowledgeBase) { e.currentTarget.style.background = '#F0EFF5' } }}
                  onMouseLeave={(e) => { if (!showKnowledgeBase) { e.currentTarget.style.background = 'transparent' } }}
                >
                  📚
                </button>
                <button
                  onClick={handleStartChat}
                  disabled={!inputMessage.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    background: inputMessage.trim() ? '#1972F5' : '#E5E7EB',
                    color: inputMessage.trim() ? 'white' : '#B0B0C5',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    boxShadow: inputMessage.trim() ? '0 2px 8px rgba(25,114,245,0.3)' : 'none',
                  }}
                >
                  ➤
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '10px', color: '#C5C5D5', margin: '8px 0 0', fontWeight: 500, letterSpacing: '0.02em' }}>
                Gu Live Chat
              </p>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setIsOpen(true); sendResizeToParent(true) }}
          className="gw-button"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#1972F5',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(25,114,245,0.35)',
            animation: 'gwPulse 2.5s ease-in-out infinite',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(25,114,245,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(25,114,245,0.35)' }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
