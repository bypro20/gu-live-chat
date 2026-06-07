'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useMessages } from '@/lib/hooks/use-messages'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { retainSocket, releaseSocket } from '@/lib/socket-client'
import { PLAN_LIMITS } from '@/lib/constants'

// ─── Conversation List Item ─────────────────────────────────────────

function ConversationItem({ conversation, selected, onClick }: {
  conversation: {
    id: string
    status: string
    lastMessageAt: string
    lastMessagePreview: string | null
    unreadCount: number
    visitor: { name: string | null; email: string | null; avatarUrl: string | null }
    assignedTo: { name: string | null; image: string | null } | null
    _count: { messages: number }
  }
  selected: boolean
  onClick: () => void
}) {
  const timeAgo = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'şimdi'
    if (diff < 3600) return `${Math.floor(diff / 60)}dk`
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa`
    return `${Math.floor(diff / 86400)}g`
  }

  const statusColor: Record<string, string> = {
    OPEN: 'bg-success',
    PENDING: 'bg-warning',
    RESOLVED: 'bg-muted-foreground',
    CLOSED: 'bg-border-strong',
  }

  const name = conversation.visitor.name || conversation.visitor.email?.split('@')[0] || 'Anonim'
  const initial = name.charAt(0).toUpperCase()

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-start gap-3 border-b border-border hover:bg-muted/60 transition text-left ${
        selected ? 'bg-primary-light border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="relative shrink-0">
        {conversation.visitor.avatarUrl ? (
          <img src={conversation.visitor.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-semibold text-primary">
            {initial}
          </div>
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColor[conversation.status] || 'bg-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-foreground truncate">{name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{timeAgo(conversation.lastMessageAt)}</span>
        </div>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
          {conversation.lastMessagePreview || 'Henüz mesaj yok'}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-brand tabular-nums">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Attachments ────────────────────────────────────────────────────

type InboxAttachment = {
  id?: string
  url: string
  fileName?: string
  filename?: string
  mimeType?: string | null
  mimetype?: string
  fileSize?: number | null
  size?: number
}

function attName(a: InboxAttachment): string {
  return a.fileName || a.filename || 'dosya'
}
function attMime(a: InboxAttachment): string {
  return (a.mimeType || a.mimetype || '') as string
}
function attSize(a: InboxAttachment): number | undefined {
  return (a.fileSize ?? a.size) ?? undefined
}
function isImageAtt(a: InboxAttachment): boolean {
  const mime = attMime(a)
  if (mime) return mime.startsWith('image/')
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attName(a) || a.url)
}
function formatBytesInbox(bytes?: number): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function AttachmentList({ attachments, onDark }: { attachments: InboxAttachment[]; onDark: boolean }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div className="flex flex-col gap-2 mt-2">
      {attachments.map((a, i) =>
        isImageAtt(a) ? (
          <a key={a.id || i} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={a.url}
              alt={attName(a)}
              className="max-w-[220px] max-h-[200px] w-auto rounded-xl border border-border object-cover"
            />
          </a>
        ) : (
          <a
            key={a.id || i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attName(a)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 max-w-[240px] no-underline ${
              onDark ? 'bg-primary-foreground/15' : 'bg-muted'
            }`}
          >
            <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${onDark ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={onDark ? 'text-primary-foreground' : 'text-primary'}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-semibold truncate ${onDark ? 'text-primary-foreground' : 'text-foreground'}`}>{attName(a)}</span>
              <span className={`block text-[11px] ${onDark ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {formatBytesInbox(attSize(a))}{attSize(a) ? ' • ' : ''}İndir
              </span>
            </span>
          </a>
        )
      )}
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────

function MessageBubble({ message, autoTranslate, canTranslate }: { message: {
  id: string
  content: string
  type: string
  senderType: string
  createdAt: string
  sentiment?: string | null
  attachments?: InboxAttachment[]
}
  autoTranslate: boolean
  canTranslate: boolean
}) {
  const isVisitor = message.senderType === 'VISITOR'
  const isSystem = message.senderType === 'SYSTEM' || message.type === 'SYSTEM'
  const isBot = message.senderType === 'BOT'
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslate, setShowTranslate] = useState(false)

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const handleTranslate = async () => {
    if (translatedText) {
      setShowTranslate(!showTranslate)
      return
    }
    setTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content, toLang: 'tr' }),
      })
      const data = await res.json()
      setTranslatedText(data.translatedText)
      setShowTranslate(true)
    } catch {
    } finally {
      setTranslating(false)
    }
  }

  useEffect(() => {
    if (autoTranslate && isVisitor && !translatedText && !translating) {
      handleTranslate()
    }
  }, [autoTranslate, message.content])

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isVisitor ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] sm:max-w-[70%] ${isVisitor ? 'order-1' : 'order-2'}`}>
        {isBot && (
          <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 block">
            🤖 Bot
          </span>
        )}
        {isVisitor && message.sentiment === 'NEGATIVE' && (
          <span className="text-[10px] text-destructive font-medium ml-1 mb-0.5 block">
            ⚠ Olumsuz ton
          </span>
        )}
        {(() => {
          const hasAtt = !!(message.attachments && message.attachments.length > 0)
          const hideText = hasAtt && /^(🖼️|📎)\s/u.test(message.content)
          if (!message.content && !hasAtt) return null
          return (
            <div className={`px-4 py-2.5 rounded-2xl text-sm ${
              isVisitor
                ? 'bg-card text-foreground rounded-bl-sm border border-border'
                : 'bg-primary text-primary-foreground rounded-br-sm shadow-brand'
            }`}>
              {!hideText && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
              {hasAtt && <AttachmentList attachments={message.attachments!} onDark={!isVisitor} />}
              {showTranslate && translatedText && (
                <p className={`text-xs mt-1.5 pt-1.5 border-t italic ${isVisitor ? 'text-muted-foreground border-border' : 'text-primary-foreground/80 border-primary-foreground/20'}`}>
                  🌐 {translatedText}
                </p>
              )}
            </div>
          )
        })()}
        <div className={`flex items-center gap-1 mt-0.5 ${isVisitor ? 'ml-1' : 'mr-1 justify-end'}`}>
          <span className="text-[10px] text-muted-foreground tabular-nums">{formatTime(message.createdAt)}</span>
          {isVisitor && canTranslate && (
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="text-[10px] text-muted-foreground hover:text-primary transition disabled:opacity-50"
              title="Türkçe’ye çevir"
            >
              {translating ? '⏳' : '🌐'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────

function InboxPageContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { activeWebsite, websites } = useActiveWebsite()
  const [allWebsites, setAllWebsites] = useState(false)
  const planLimits = activeWebsite
    ? PLAN_LIMITS[activeWebsite.plan as keyof typeof PLAN_LIMITS]
    : null
  const canTranslate = planLimits?.autoTranslate ?? false
  const canAiAssistant = planLimits?.aiAssistant ?? false
  const canCannedResponses = planLimits?.cannedResponses ?? false
  const [aiSuggestEnabled, setAiSuggestEnabled] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'PENDING' | 'RESOLVED'>('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [typingPreview, setTypingPreview] = useState<{ conversationId: string; content: string } | null>(null)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [detectedVisitorLang, setDetectedVisitorLang] = useState<string | null>(null)
  const [translatingOutgoing, setTranslatingOutgoing] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [cannedResponses, setCannedResponses] = useState<Array<{ id: string; title: string; content: string; shortcut: string | null }>>([])
  const [showCannedPicker, setShowCannedPicker] = useState(false)
  const [updatingConversation, setUpdatingConversation] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const updateConversation = async (patch: { status?: string; assignedToId?: string | null }) => {
    if (!selectedId) return
    setUpdatingConversation(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Güncellenemedi')
      }
      await mutateConversations()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingConversation(false)
    }
  }

  const { conversations, total, isLoading, error, mutate: mutateConversations } = useConversations({
    status: filter,
    search: search || undefined,
    page: 1,
    limit: 50,
    allWebsites,
  })

  const { messages, isLoading: messagesLoading, sendMessage, sending, mutate: mutateMessages } = useMessages(selectedId)

  const conversationFromUrl = searchParams.get('conversation')
  useEffect(() => {
    if (!conversationFromUrl || isLoading) return
    const exists = conversations.some((c) => c.id === conversationFromUrl)
    if (exists) setSelectedId(conversationFromUrl)
  }, [conversationFromUrl, conversations, isLoading])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket connection for real-time messages and typing preview
  useEffect(() => {
    if (!session?.user?.id || !activeWebsite?.websiteId) return

    const socket = retainSocket()
    if (!socket) return

    const onTypingPreview = (data: { conversationId: string; content: string }) => {
      setTypingPreview(data)
    }

    const onTypingPreviewClear = (data: { conversationId: string }) => {
      setTypingPreview((prev) => prev?.conversationId === data.conversationId ? null : prev)
    }

    const onAgentTypingStop = (data: { conversationId: string }) => {
      setTypingPreview((prev) => prev?.conversationId === data.conversationId ? null : prev)
    }

    const onAgentMessage = (data: {
      id: string
      conversationId: string
      content: string
      type: string
      senderType: string
      createdAt: string
      senderId?: string
    }) => {
      if (data.conversationId !== selectedId) {
        mutateConversations()
        return
      }
      mutateMessages((current) => {
        if (!current) return current
        if (current.messages.some((m) => m.id === data.id)) return current
        return {
          ...current,
          messages: [
            ...current.messages,
            {
              id: data.id,
              conversationId: data.conversationId,
              content: data.content,
              type: data.type,
              senderType: data.senderType,
              senderId: data.senderId ?? null,
              createdAt: data.createdAt,
              readAt: null,
              attachments: [],
            },
          ],
        }
      }, { revalidate: false })
      mutateConversations()
    }

    const onConversationUpdate = () => {
      mutateConversations()
    }

    const onNewConversation = (data: { conversationId: string }) => {
      mutateConversations()
      setSelectedId((current) => current ?? data.conversationId)
    }

    socket.on('visitor:typing-preview', onTypingPreview)
    socket.on('visitor:typing-preview:clear', onTypingPreviewClear)
    socket.on('agent:typing:stop', onAgentTypingStop)
    socket.on('agent:message', onAgentMessage)
    socket.on('agent:conversation:updated', onConversationUpdate)
    socket.on('agent:conversation:new', onNewConversation)

    const authenticate = () => {
      socket.emit('agent:auth', {
        userId: session.user.id,
        websiteIds: [activeWebsite.websiteId],
      })
    }

    if (socket.connected) {
      authenticate()
    } else {
      socket.on('connect', authenticate)
    }

    return () => {
      socket.off('visitor:typing-preview', onTypingPreview)
      socket.off('visitor:typing-preview:clear', onTypingPreviewClear)
      socket.off('agent:typing:stop', onAgentTypingStop)
      socket.off('agent:message', onAgentMessage)
      socket.off('agent:conversation:updated', onConversationUpdate)
      socket.off('agent:conversation:new', onNewConversation)
      socket.off('connect', authenticate)
      releaseSocket()
    }
  }, [activeWebsite?.websiteId, session?.user?.id, selectedId, mutateMessages, mutateConversations])

  // Join conversation room when selected
  useEffect(() => {
    if (!selectedId || !session?.user?.id) return

    const socket = retainSocket()
    if (!socket) return
    const join = () => {
      socket.emit('agent:join-conversation', { conversationId: selectedId })
    }

    if (socket.connected) {
      join()
    } else {
      socket.on('connect', join)
    }

    return () => {
      socket.off('connect', join)
      releaseSocket()
    }
  }, [selectedId, session?.user?.id])

  // Reset detected language when conversation changes
  useEffect(() => {
    setDetectedVisitorLang(null)
  }, [selectedId])

  useEffect(() => {
    if (!activeWebsite?.websiteId) {
      setAiSuggestEnabled(false)
      return
    }
    fetch(`/api/ai/config?websiteId=${activeWebsite.websiteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { aiConfig?: { isActive?: boolean; autoSuggest?: boolean } } | null) => {
        setAiSuggestEnabled(!!data?.aiConfig?.isActive && data?.aiConfig?.autoSuggest !== false)
      })
      .catch(() => setAiSuggestEnabled(false))
  }, [activeWebsite?.websiteId])

  const lastVisitorSentiment = messages
    .filter((m) => m.senderType === 'VISITOR')
    .slice(-1)[0]?.sentiment

  useEffect(() => {
    if (!activeWebsite?.websiteId || !canCannedResponses) {
      setCannedResponses([])
      return
    }
    fetch(`/api/canned-responses?websiteId=${activeWebsite.websiteId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCannedResponses(Array.isArray(data) ? data : []))
      .catch(() => setCannedResponses([]))
  }, [activeWebsite?.websiteId, canCannedResponses])

  const cannedQuery = messageText.startsWith('/') ? messageText.slice(1).toLowerCase() : ''
  const filteredCanned = showCannedPicker
    ? cannedResponses.filter((r) => {
        if (!cannedQuery) return true
        return (
          r.title.toLowerCase().includes(cannedQuery) ||
          (r.shortcut?.toLowerCase().includes(cannedQuery) ?? false)
        )
      })
    : []

  const handleMessageChange = (value: string) => {
    setMessageText(value)
    if (canCannedResponses && value.startsWith('/')) {
      setShowCannedPicker(true)
    } else {
      setShowCannedPicker(false)
    }
  }

  const selectCannedResponse = (content: string) => {
    setMessageText(content)
    setShowCannedPicker(false)
  }

  // Detect visitor language from recent messages when auto-translate is on
  useEffect(() => {
    if (!autoTranslate || !canTranslate || !activeWebsite) return
    const visitorText = messages
      .filter((m) => m.senderType === 'VISITOR')
      .slice(-3)
      .map((m) => m.content)
      .join(' ')
      .trim()
      .slice(0, 300)
    if (!visitorText) return

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: visitorText, toLang: 'tr', websiteId: activeWebsite.websiteId }),
    })
      .then((r) => r.json())
      .then((data) => {
        const lang = data.detectedLanguage as string | undefined
        if (lang && lang !== 'tr') setDetectedVisitorLang(lang)
        else setDetectedVisitorLang(null)
      })
      .catch(() => {})
  }, [autoTranslate, messages, canTranslate, activeWebsite])

  const handleSend = async () => {
    if (!messageText.trim() || sending || !selectedId) return
    setSendError(null)
    let textToSend = messageText.trim()

    // Translate outgoing message to visitor's language when auto-translate is active
    if (autoTranslate && canTranslate && detectedVisitorLang) {
      setTranslatingOutgoing(true)
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToSend,
            toLang: detectedVisitorLang,
            fromLang: 'tr',
            websiteId: activeWebsite?.websiteId,
          }),
        })
        const data = await res.json()
        if (data.translatedText && data.translatedText !== textToSend) {
          textToSend = data.translatedText
        }
      } catch {
        // Send original on error
      } finally {
        setTranslatingOutgoing(false)
      }
    }

    try {
      await sendMessage(textToSend)
      setMessageText('')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Mesaj gönderilemedi')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAiSuggest = async () => {
    if (!selectedId || aiSuggesting) return
    setAiSuggesting(true)
    setAiError(null)
    try {
      const res = await fetch(`/api/conversations/${selectedId}/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'AI önerisi alınamadı')
      }
      if (data.suggestion) {
        setMessageText(data.suggestion)
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI önerisi alınamadı')
    } finally {
      setAiSuggesting(false)
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedId)

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-screen flex bg-background text-foreground">
      {/* Conversation List */}
      <div className={`w-full lg:w-96 border-r border-border flex-col bg-card ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">Gelen Kutusu</h1>
            {total > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                {total} sohbet
              </span>
            )}
          </div>
          {activeWebsite && (
            <p className="text-[11px] text-muted-foreground mb-2 truncate" title={activeWebsite.websiteId}>
              {allWebsites ? 'Tüm siteleriniz' : `${activeWebsite.name} · widget mesajları`}
            </p>
          )}
          {websites.length > 1 && (
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setAllWebsites(false)}
                disabled={!activeWebsite}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition truncate max-w-[160px] ${
                  !allWebsites
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title={activeWebsite?.name}
              >
                {activeWebsite?.name || 'Aktif site'}
              </button>
              <button
                type="button"
                onClick={() => setAllWebsites(true)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                  allWebsites
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Tüm siteler
              </button>
            </div>
          )}
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {([
              { key: 'all' as const, label: 'Tümü' },
              { key: 'OPEN' as const, label: 'Açık' },
              { key: 'PENDING' as const, label: 'Bekleyen' },
              { key: 'RESOLVED' as const, label: 'Çözülen' },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sohbet ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !activeWebsite ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-6">
              <p className="text-sm text-muted-foreground">Site yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-6 gap-2">
              <p className="text-sm text-destructive">{error.message}</p>
              <button
                type="button"
                onClick={() => mutateConversations()}
                className="text-xs text-primary underline"
              >
                Tekrar dene
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">Henüz sohbet yok</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {activeWebsite
                  ? `Sitenize eklediğiniz widget kodundan gelen mesajlar burada görünür. Ayarlar → Widget sayfasındaki embed kodunu kullanın.`
                  : 'Önce bir web sitesi oluşturun veya davet kabul edin.'}
              </p>
              {activeWebsite && (
                <p className="text-[10px] text-muted-foreground mt-3 font-mono break-all">
                  Widget ID: {activeWebsite.websiteId}
                </p>
              )}
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                selected={selectedId === conv.id}
                onClick={() => setSelectedId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail / Empty State */}
      <div className={`flex-1 flex-col bg-muted/40 dark:bg-background min-w-0 ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Sohbet seçin</h2>
              <p className="text-muted-foreground mt-1">Detayları görmek için bir sohbet seçin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b border-border bg-card flex items-center gap-3">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden -ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
                aria-label="Geri"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {(selectedConversation.visitor.name || selectedConversation.visitor.email || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">
                  {selectedConversation.visitor.name || selectedConversation.visitor.email?.split('@')[0] || 'Anonim'}
                </h2>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    selectedConversation.status === 'OPEN' ? 'bg-success' :
                    selectedConversation.status === 'PENDING' ? 'bg-warning' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {selectedConversation.status === 'OPEN' ? 'Açık' :
                     selectedConversation.status === 'PENDING' ? 'Bekliyor' :
                     selectedConversation.status === 'RESOLVED' ? 'Çözüldü' : 'Kapalı'}
                  </span>
                  {selectedConversation.visitor.email && (
                    <span className="text-xs text-muted-foreground/70 truncate hidden sm:inline">· {selectedConversation.visitor.email}</span>
                  )}
                </div>
              </div>
              {selectedConversation.assignedTo && (
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0 hidden sm:block">
                  {selectedConversation.assignedTo.name || 'Temsilci'}
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0">
                {session?.user?.id && (
                  <button
                    type="button"
                    disabled={updatingConversation}
                    onClick={() => updateConversation({ assignedToId: session.user!.id })}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-50 transition hidden md:inline"
                    title="Sohbeti bana ata"
                  >
                    Bana ata
                  </button>
                )}
                {selectedConversation.status !== 'RESOLVED' && selectedConversation.status !== 'CLOSED' ? (
                  <button
                    type="button"
                    disabled={updatingConversation}
                    onClick={() => updateConversation({ status: 'RESOLVED' })}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-success/15 text-success hover:bg-success/25 disabled:opacity-50 transition"
                    title="Çözüldü olarak işaretle"
                  >
                    Çözüldü
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingConversation}
                    onClick={() => updateConversation({ status: 'OPEN' })}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-primary-light text-primary hover:bg-primary/15 disabled:opacity-50 transition"
                    title="Sohbeti yeniden aç"
                  >
                    Yeniden aç
                  </button>
                )}
              </div>
              {/* Translate toggle in chat header */}
              <button
                onClick={() => canTranslate && setAutoTranslate((v) => !v)}
                title={
                  !canTranslate
                    ? 'Otomatik çeviri PRO plana dahildir'
                    : autoTranslate
                    ? 'Çeviriyi kapat'
                    : 'Otomatik çeviriyi aç'
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  !canTranslate
                    ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                    : autoTranslate
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden sm:inline">
                  {autoTranslate && detectedVisitorLang
                    ? detectedVisitorLang.toUpperCase() + ' ↔ TR'
                    : 'Çeviri'}
                </span>
                {!canTranslate && <span className="text-[10px] text-amber-400 hidden sm:inline">(PRO)</span>}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground mt-8">
                  Henüz mesaj yok
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} autoTranslate={autoTranslate} canTranslate={canTranslate} />
                ))
              )}
              {typingPreview && typingPreview.conversationId === selectedId && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <div className="px-4 py-2.5 rounded-2xl text-sm bg-card text-muted-foreground italic border border-border rounded-bl-sm">
                      {typingPreview.content}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-border bg-card">
              <div className="flex items-center justify-between gap-2 mb-2">
                {canAiAssistant && aiSuggestEnabled && (
                <button
                  onClick={handleAiSuggest}
                  disabled={aiSuggesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-light text-primary hover:bg-primary/15 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  title="Yapay zekâdan yanıt önerisi al"
                >
                  {aiSuggesting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Öneri hazırlanıyor...
                    </>
                  ) : (
                    <>✨ AI ile yanıtla</>
                  )}
                </button>
                )}
                {lastVisitorSentiment === 'NEGATIVE' && (
                  <span className="text-[11px] text-destructive font-medium">⚠ Ziyaretçi olumsuz — öncelik verin</span>
                )}
                {aiError && (
                  <span className="text-[11px] text-destructive truncate">{aiError}</span>
                )}
              </div>
              {autoTranslate && canTranslate && detectedVisitorLang && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-primary/70">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Gelen mesajlar TR&apos;ye çevriliyor · Giden mesajlar {detectedVisitorLang.toUpperCase()}&apos;ye çevriliyor
                </div>
              )}
              {sendError && (
                <p className="text-xs text-destructive mb-2">{sendError}</p>
              )}
              <div className="flex items-end gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  {showCannedPicker && filteredCanned.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-10">
                      {filteredCanned.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => selectCannedResponse(r.content)}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition border-b border-border last:border-b-0"
                        >
                          <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                          {r.shortcut && (
                            <p className="text-[10px] text-muted-foreground">/{r.shortcut}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={messageText}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      autoTranslate && canTranslate && detectedVisitorLang
                        ? `Türkçe yazın — ${detectedVisitorLang.toUpperCase()}'ye çevrilerek gönderilecek`
                        : canCannedResponses
                          ? 'Mesaj yazın... (hazır cevap için / yazın)'
                          : 'Mesaj yazın...'
                    }
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sending || translatingOutgoing}
                  className="w-11 h-11 bg-primary hover:bg-primary-hover disabled:bg-muted-foreground/30 disabled:cursor-not-allowed text-primary-foreground rounded-xl flex items-center justify-center transition shrink-0 shadow-brand"
                  title={translatingOutgoing ? 'Çevriliyor...' : 'Gönder'}
                >
                  {translatingOutgoing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Gelen kutusu yükleniyor...
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  )
}