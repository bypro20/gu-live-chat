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

const AGENT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elif&backgroundColor=c0aede'
const AGENT_NAME = 'Destek Ekibi'

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
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [showPreChat, setShowPreChat] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [avatarLoaded, setAvatarLoaded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

        visitorTokenRef.current = data.visitorToken
        sessionIdRef.current = data.sessionId
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

    const socket = connectSocket()

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('visitor:auth', {
        visitorToken: visitorTokenRef.current,
        websiteId,
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

    return () => {
      disconnectSocket()
    }
  }, [isInitialized, websiteId])

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

  const primaryColor = config?.primaryColor || '#6C3CE1'
  const gradientStart = '#6C3CE1'
  const gradientEnd = '#8B5CF6'
  const agentsOnline = config?.agentsOnline ?? 1

  if (!isInitialized || !config) {
    const loadingWidget = (
      <div style={{ width: '100vw', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '3px solid rgba(108,60,225,0.15)', borderTopColor: gradientStart, borderRadius: '50%', animation: 'gwSpin 0.8s linear infinite' }}></div>
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
      color: '#1A1533',
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
          0% { box-shadow: 0 8px 32px rgba(108,60,225,0.35); }
          50% { box-shadow: 0 8px 48px rgba(108,60,225,0.55); }
          100% { box-shadow: 0 8px 32px rgba(108,60,225,0.35); }
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
            background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)',
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
                  <img
                    src={AGENT_AVATAR}
                    alt={AGENT_NAME}
                    onLoad={() => setAvatarLoaded(true)}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: avatarLoaded ? 'block' : 'none',
                      borderRadius: '50%',
                    }}
                  />
                  {!avatarLoaded && (
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>D</span>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2px solid white',
                  zIndex: 2,
                }}>
                  {agentsOnline > 0 && (
                    <div style={{
                      position: 'absolute', inset: '-2px', borderRadius: '50%',
                      border: '2px solid rgba(34,197,94,0.35)',
                      animation: 'gwRing 2s ease-out infinite',
                    }} />
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, letterSpacing: '-0.01em' }}>
                  {AGENT_NAME}
                </p>
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '11px',
                  margin: '2px 0 0',
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#86efac',
                  }} />
                  {agentsOnline > 0 ? 'Çevrimiçi • Tipik yanıt: 2 dk' : 'Çevrimdışı'}
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

          <div className="gw-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: '#F8F7FF',
          }}>
            <div style={{ textAlign: 'center', margin: '0 0 12px', flexShrink: 0 }}>
              <span style={{
                fontSize: '11px',
                color: '#76728A',
                background: '#EEEDF5',
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
                border: '2px solid #E8E5F0',
              }}>
                <img
                  src={AGENT_AVATAR}
                  alt={AGENT_NAME}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ maxWidth: '270px' }}>
                <p style={{ margin: '0 0 3px 4px', fontSize: '11px', fontWeight: 600, color: '#76728A' }}>
                  {AGENT_NAME}
                </p>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px 12px 12px 4px',
                  padding: '12px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1A1533', lineHeight: '1.6' }}>
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
                      border: '1px solid rgba(108,60,225,0.12)',
                      borderRadius: '20px',
                      padding: '9px 16px',
                      fontSize: '13px',
                      color: '#1A1533',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      fontWeight: 500,
                      maxWidth: 'fit-content',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6C3CE1'
                      e.currentTarget.style.background = 'rgba(108,60,225,0.04)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(108,60,225,0.12)'
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
                        background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)',
                        color: 'white',
                        borderRadius: '12px 12px 4px 12px',
                        padding: '11px 16px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        boxShadow: '0 2px 8px rgba(108,60,225,0.25)',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', margin: '4px 4px 0 0' }}>
                        <span style={{ fontSize: '10px', color: '#B0B0C5', fontWeight: 500 }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {idx === messages.length - 1 && (
                          <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'gwCheckIn 0.3s ease-out' }}>
                            <path d="M3 6l2 2 4-4" stroke="#6C3CE1" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
                      border: '2px solid #E8E5F0',
                    }}>
                      <img
                        src={AGENT_AVATAR}
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
                        color: '#1A1533',
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
                  border: '2px solid #E8E5F0',
                }}>
                  <img src={AGENT_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <div ref={messagesEndRef} />
          </div>

          {showPreChat ? (
            <div style={{
              padding: '24px 20px 20px',
              borderTop: '1px solid #E8E5F0',
              background: '#ffffff',
              flexShrink: 0,
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '48px', height: '48px', margin: '0 auto 12px',
                  borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid #E8E5F0',
                }}>
                  <img src={AGENT_AVATAR} alt={AGENT_NAME} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1533', margin: '0 0 4px' }}>Merhaba! 👋</p>
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
                      border: '1px solid #E8E5F0', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F8F7FF', color: '#1A1533',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6C3CE1'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,60,225,0.12)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E5F0'; e.currentTarget.style.background = '#F8F7FF'; e.currentTarget.style.boxShadow = 'none' }}
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
                      border: '1px solid #E8E5F0', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F8F7FF', color: '#1A1533',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6C3CE1'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,60,225,0.12)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E5F0'; e.currentTarget.style.background = '#F8F7FF'; e.currentTarget.style.boxShadow = 'none' }}
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
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,60,225,0.35)'
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
              borderTop: '1px solid #E8E5F0',
              background: '#ffffff',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <button
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#B0B0C5',
                    transition: 'all 0.2s',
                    fontSize: '18px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F0EFF5'; e.currentTarget.style.color = '#76728A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B0B0C5' }}
                >
                  😊
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
                    border: '1px solid #E8E5F0',
                    borderRadius: '20px',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                    background: '#F8F7FF',
                    color: '#1A1533',
                    transition: 'all 0.2s',
                    maxHeight: '120px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6C3CE1'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,60,225,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E5F0'; e.currentTarget.style.background = '#F8F7FF'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  onClick={handleStartChat}
                  disabled={!inputMessage.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    background: inputMessage.trim() ? 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' : '#E8E5F0',
                    color: inputMessage.trim() ? 'white' : '#B0B0C5',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    boxShadow: inputMessage.trim() ? '0 2px 8px rgba(108,60,225,0.3)' : 'none',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
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
            background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(108,60,225,0.35)',
            animation: 'gwPulse 2.5s ease-in-out infinite',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(108,60,225,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,60,225,0.35)' }}
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
