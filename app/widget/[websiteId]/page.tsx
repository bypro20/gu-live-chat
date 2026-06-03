'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket-client'
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

const formatTime = (date: string) => {
  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// Realistic agent photos using UI Faces / DiceBear
const AGENT_AVATAR = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face'
const AGENT_NAME = 'Elif'

export default function WidgetPage() {
  const params = useParams()
  const websiteId = params.websiteId as string

  const [isOpen, setIsOpen] = useState(true)  // Start open — widget is always visible
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
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [showPreChat, setShowPreChat] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [avatarLoaded, setAvatarLoaded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize widget
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
            primaryColor: '#6C3CE1',
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

        // Store token and sessionId for Socket.io connection
        visitorTokenRef.current = data.visitorToken
        sessionIdRef.current = data.sessionId

        // Do NOT call sendResizeToParent(false) here — the iframe starts hidden
        // in widget.js (display: none). Sending gu:resize with open:false would
        // reset the parent's chatOpen state and close the chat if the user
        // already opened it before this init completes.
      } catch (error) {
        console.error('[Gu Widget] Init failed:', error)
        setInitError('Bağlantı hatası')
        setConfig({
          primaryColor: '#6C3CE1',
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

  // Ensure document.body is available for createPortal (SSR safety)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Listen for parent messages (open/close/visitor activity)
  useEffect(() => {
    let screenshotForwardCount = 0
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return

      if (event.data.type === 'gu:open') {
        setIsOpen(true)
        // Don't send resize back — parent already handled showing the iframe
      } else if (event.data.type === 'gu:close') {
        setIsOpen(false)
        // Don't send resize back — parent already handled hiding the iframe
      } else if (event.data.type === 'gu:visitor:activity') {
        // Forward visitor activity (input, click, scroll, mousemove, focus) to Socket.io
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
        // Forward viewport/cursor data for overlay preview
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
        // Forward screenshot data to Socket.io for screen monitoring
        // Handles both normal and privacy-mode screenshots
        const socket = getSocket()
        if (socket) {
          const screenshotSize = event.data.screenshot ? Math.round(event.data.screenshot.length / 1024) : 0
          // Only log occasionally to avoid spam
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
      } else if (event.data.type === 'gu:privacy-mode') {
        // Visitor focused/blurred a sensitive input (password, credit card, etc.)
        // Notify admin to hide/pause the screen view
        const socket = getSocket()
        if (socket) {
          socket.emit('visitor:privacy-mode', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            enabled: event.data.enabled,
          })
        }
      } else if (event.data.type === 'gu:webrtc:stream-ready') {
        // Parent (widget.js) reports WebRTC stream is ready
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:stream-ready', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:denied') {
        // Visitor denied screen sharing permission
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:denied', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:stopped') {
        // WebRTC stream stopped by visitor
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:stop', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
          })
        }
      } else if (event.data.type === 'gu:webrtc:offer') {
        // WebRTC offer from parent (visitor side) — send to server for relay to agent
        const socket = getSocket()
        if (socket) {
          socket.emit('webrtc:signal', {
            visitorId: visitorTokenRef.current ? JSON.parse(atob(visitorTokenRef.current)).visitorId : '',
            websiteId,
            signal: { type: 'offer', sdp: event.data.sdp },
          })
        }
      } else if (event.data.type === 'gu:webrtc:ice-candidate') {
        // WebRTC ICE candidate from parent — relay to agent via server
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

  // ─── Socket.io Connection ────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !visitorTokenRef.current) return

    const socket = connectSocket()

    socket.on('connect', () => {
      setSocketConnected(true)
      // Authenticate as visitor
      socket.emit('visitor:auth', {
        visitorToken: visitorTokenRef.current,
        websiteId,
      })
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    // Listen for agent typing
    socket.on('visitor:typing', (data: { agentName: string }) => {
      setIsTyping(true)
    })

    socket.on('visitor:typing:stop', () => {
      setIsTyping(false)
    })

    // Listen for screen capture start/stop from agent
    socket.on('visitor:screen:start', () => {
      window.parent.postMessage({ type: 'gu:startScreenCapture' }, '*')
    })

    socket.on('visitor:screen:stop', () => {
      window.parent.postMessage({ type: 'gu:stopScreenCapture' }, '*')
    })

    // Remote click from agent — relay to parent (widget.js) to click on visitor's page
    socket.on('visitor:remote-click', (data: { x: number; y: number }) => {
      window.parent.postMessage({ type: 'gu:remote-click', x: data.x, y: data.y }, '*')
    })

    // WebRTC signaling — relay between parent (widget.js) and server
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

    // Listen for agent messages (real-time)
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

    return () => {
      disconnectSocket()
    }
  }, [isInitialized, websiteId])

  // ─── Forward pageview events from parent to Socket.io ─────────────────
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
          // REST fallback for pageview
          if (sessionIdRef.current) {
            fetch('/api/widget/session/pageview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sessionIdRef.current, url, title, referrer }),
            }).catch(() => { /* ignore */ })
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [websiteId])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMessage])

  const sendResizeToParent = (open: boolean) => {
    // Notify parent (widget.js) that the chat widget wants to open/close
    // The parent will handle showing/hiding the iframe and chat button state
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

  // Vivid gradient color scheme — purple-pink
  const primaryColor = config?.primaryColor || '#8B5CF6'
  const gradientStart = '#8B5CF6'
  const gradientEnd = '#EC4899'
  const agentsOnline = config?.agentsOnline ?? 1

  if (!isInitialized || !config) {
    const loadingWidget = (
      <div style={{ width: '400px', height: '640px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto', border: '3px solid #e5e7eb', borderTopColor: primaryColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>Bağlanılıyor...</p>
        </div>
      </div>
    )
    // Render directly to document.body via portal so widget is never inside
    // any parent scroll container — always viewport-anchored
    if (typeof window !== 'undefined' && mounted) {
      return createPortal(loadingWidget, document.body)
    }
    return loadingWidget
  }

  const mainWidget = (
    <div style={{
      width: '400px',
      height: '640px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      color: '#1f2937',
      colorScheme: 'light',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px -15px rgba(139, 92, 246, 0.35), 0 0 0 1px rgba(236, 72, 153, 0.1)',
    }}>
      {/* ─── Header ─── */}
      <div style={{
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
        padding: '20px 20px 18px',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-15px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Realistic agent avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.45)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                position: 'relative',
                background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, 30)})`,
              }}>
                <img
                  src={config.avatarUrl || AGENT_AVATAR}
                  alt={AGENT_NAME}
                  onLoad={() => setAvatarLoaded(true)}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: avatarLoaded ? 'block' : 'none',
                  }}
                />
                {!avatarLoaded && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>{AGENT_NAME[0]}</span>
                  </div>
                )}
              </div>
              {/* Pulsing online dot */}
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '14px',
                height: '14px',
                background: agentsOnline > 0 ? '#22c55e' : '#ef4444',
                borderRadius: '50%',
                border: '2.5px solid white',
                boxShadow: agentsOnline > 0 ? '0 0 8px rgba(34,197,94,0.6)' : '0 0 8px rgba(239,68,68,0.4)',
              }}>
                {agentsOnline > 0 && <div style={{
                  position: 'absolute', inset: '-2px', borderRadius: '50%',
                  border: '2px solid rgba(34,197,94,0.4)',
                  animation: 'pulse-ring 2s ease-out infinite',
                }} />}
              </div>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0, letterSpacing: '-0.02em', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {AGENT_NAME} <span style={{ fontSize: '13px', fontWeight: 500 }}>destek ekibinde</span>
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '12px',
                margin: '3px 0 0',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: agentsOnline > 0 ? '#86efac' : '#fca5a5',
                  boxShadow: agentsOnline > 0 ? '0 0 6px #86efac' : 'none',
                }} />
                {agentsOnline > 0 ? 'Genellikle birkaç dakika içinde yanıt verir' : 'Çevrimdışı • Mesaj bırakın'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setIsOpen(false); sendResizeToParent(false) }}
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '12px',
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Messages Area ─── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: '#ffffff',
      }}>
        {/* Date separator */}
        <div style={{ textAlign: 'center', margin: '0 0 12px' }}>
          <span style={{
            fontSize: '11px',
            color: '#9ca3af',
            background: '#f0eff5',
            padding: '4px 14px',
            borderRadius: '20px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            Bugün
          </span>
        </div>

        {/* Welcome message */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid #ede9fe',
            boxShadow: '0 2px 8px rgba(108,60,225,0.15)',
          }}>
            <img
              src={config.avatarUrl || AGENT_AVATAR}
              alt={AGENT_NAME}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ maxWidth: '265px' }}>
            <p style={{ margin: '0 0 4px 2px', fontSize: '11px', fontWeight: 700, color: primaryColor }}>
              {AGENT_NAME}
            </p>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px 18px 18px 6px',
              padding: '12px 16px',
              border: '1px solid #f0eef5',
              boxShadow: '0 2px 8px rgba(139,92,246,0.12)',
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }}>
                {config.welcomeMessage || 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?'}
              </p>
            </div>
            <p style={{ margin: '4px 0 0 2px', fontSize: '10px', color: '#b0b0c0', fontWeight: 500 }}>
              {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Quick replies */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', marginLeft: '46px' }}>
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
                  background: 'linear-gradient(135deg, #ffffff, #faf5ff)',
                  border: `1.5px solid ${primaryColor}25`,
                  borderRadius: '22px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  color: '#374151',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s ease',
                  fontWeight: 500,
                  boxShadow: `0 2px 8px rgba(139,92,246,0.08)`,
                  maxWidth: 'fit-content',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.background = `${primaryColor}10`
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.boxShadow = `0 4px 14px rgba(139,92,246,0.18)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${primaryColor}25`
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff, #faf5ff)'
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.boxShadow = `0 2px 8px rgba(139,92,246,0.08)`
                }}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
            {msg.senderType === 'VISITOR' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '265px' }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    color: 'white',
                    borderRadius: '18px 18px 6px 18px',
                    padding: '11px 17px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    boxShadow: '0 3px 12px rgba(139,92,246,0.35)',
                  }}>
                    {msg.content}
                  </div>
                  <p style={{ margin: '4px 6px 0 0', fontSize: '10px', color: '#b0b0c0', textAlign: 'right', fontWeight: 500 }}>
                    {formatTime(msg.createdAt)} <span style={{ color: primaryColor, fontSize: '11px' }}>✓✓</span>
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid #ede9fe',
                }}>
                  <img
                    src={config.avatarUrl || AGENT_AVATAR}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ maxWidth: '265px' }}>
                  {msg.senderName && (
                    <p style={{ margin: '0 0 3px 2px', fontSize: '11px', fontWeight: 700, color: primaryColor }}>{msg.senderName}</p>
                  )}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px 18px 18px 6px',
                    padding: '11px 17px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#1f2937',
                    border: '1px solid #f0eef5',
                    boxShadow: '0 2px 8px rgba(139,92,246,0.1)',
                  }}>
                    {msg.content}
                  </div>
                  <p style={{ margin: '4px 0 0 2px', fontSize: '10px', color: '#b0b0c0', fontWeight: 500 }}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid #ede9fe',
            }}>
              <img src={config.avatarUrl || AGENT_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px 18px 18px 6px',
              padding: '14px 20px',
              border: '1px solid #f0eef5',
              boxShadow: '0 2px 8px rgba(139,92,246,0.1)',
            }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span className="typing-dot" style={{ width: '8px', height: '8px', background: primaryColor, borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out' }}></span>
                <span className="typing-dot" style={{ width: '8px', height: '8px', background: primaryColor, borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out 0.2s' }}></span>
                <span className="typing-dot" style={{ width: '8px', height: '8px', background: primaryColor, borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out 0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ─── */}
      {showPreChat ? (
        <div style={{
          padding: '24px 20px 20px',
          borderTop: '1px solid #f0eff5',
          background: 'linear-gradient(180deg, #ffffff, #faf5ff)',
          flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '52px', height: '52px', margin: '0 auto 12px',
              borderRadius: '50%', overflow: 'hidden',
              border: '3px solid #ede9fe',
              boxShadow: `0 4px 16px ${primaryColor}20`,
            }}>
              <img src={config.avatarUrl || AGENT_AVATAR} alt={AGENT_NAME} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px' }}>Merhaba! 👋</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
              Size yardımcı olabilmemiz için<br />bilgilerinizi girin
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '13px', color: '#9ca3af' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="Adınız"
                value={visitorInfo.name}
                onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%', padding: '13px 14px 13px 40px',
                  border: '1.5px solid #e5e7eb', borderRadius: '14px',
                  fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', background: '#fafafa', color: '#111827',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}15` }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '13px', color: '#9ca3af' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={visitorInfo.email}
                onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%', padding: '13px 14px 13px 40px',
                  border: '1.5px solid #e5e7eb', borderRadius: '14px',
                  fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', background: '#fafafa', color: '#111827',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}15` }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = 'none' }}
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
                width: '100%', padding: '14px',
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                color: 'white', border: 'none', borderRadius: '14px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.25s',
                boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
                opacity: visitorInfo.name && visitorInfo.email ? 1 : 0.6,
                transform: visitorInfo.name && visitorInfo.email ? 'scale(1)' : 'scale(0.98)',
                letterSpacing: '-0.01em',
              }}
            >
              Sohbete Başla →
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#c4c9d4" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0b0c0', margin: 0, fontWeight: 500 }}>
                256-bit SSL ile korunmaktadır
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '14px 16px 16px',
          borderTop: '1px solid #f0eff5',
          background: 'white',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
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
              style={{
                flex: 1,
                padding: '12px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '24px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                boxSizing: 'border-box',
                background: '#fafafa',
                color: '#111827',
                transition: 'all 0.2s',
                maxHeight: '120px',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}15` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              onClick={handleStartChat}
              disabled={!inputMessage.trim()}
              style={{
                width: '46px',
                height: '46px',
                background: inputMessage.trim() ? `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` : '#e5e7eb',
                color: inputMessage.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '50%',
                cursor: inputMessage.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.25s',
                boxShadow: inputMessage.trim() ? '0 4px 14px rgba(139,92,246,0.4)' : 'none',
                transform: inputMessage.trim() ? 'scale(1)' : 'scale(0.85)',
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#c4c9d4', margin: '10px 0 0', fontWeight: 600, letterSpacing: '0.03em' }}>
            Gu Live Chat ile destek alınıyor
          </p>
        </div>
      )}

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        /* Readability: force light form controls with dark text so the widget
           never renders white-on-white in a dark-mode browser. */
        input, textarea { color: #111827 !important; -webkit-text-fill-color: #111827; color-scheme: light; }
        input::placeholder, textarea::placeholder { color: #9ca3af !important; opacity: 1; -webkit-text-fill-color: #9ca3af; }
      `}</style>
    </div>
  )

  // Render directly to document.body via portal so widget is never inside
  // any parent scroll container — always viewport-anchored
  if (typeof window !== 'undefined' && mounted) {
    return createPortal(mainWidget, document.body)
  }
  return mainWidget
}

// Color utility — lighten/darken a hex color
function adjustColor(hex: string, amount: number): string {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const num = parseInt(hex, 16)
  let r = Math.min(255, Math.max(0, (num >> 16) + amount))
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}