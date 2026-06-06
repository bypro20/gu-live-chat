'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useMessages } from '@/lib/hooks/use-messages'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { retainSocket, releaseSocket } from '@/lib/socket-client'

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

function MessageBubble({ message, autoTranslate }: { message: {
  id: string
  content: string
  type: string
  senderType: string
  createdAt: string
  attachments?: InboxAttachment[]
}
  autoTranslate: boolean
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
        {(isBot) && (
          <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 block">
            🤖 Bot
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
          {isVisitor && (
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

export default function InboxPage() {
  const { data: session } = useSession()
  const { activeWebsite } = useActiveWebsite()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'PENDING' | 'RESOLVED'>('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [typingPreview, setTypingPreview] = useState<{ conversationId: string; content: string } | null>(null)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, total, isLoading, error, mutate: mutateConversations } = useConversations({
    status: filter,
    search: search || undefined,
    page: 1,
    limit: 50,
  })

  const { messages, isLoading: messagesLoading, sendMessage, sending, mutate: mutateMessages } = useMessages(selectedId)

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

    socket.on('visitor:typing-preview', onTypingPreview)
    socket.on('visitor:typing-preview:clear', onTypingPreviewClear)
    socket.on('agent:typing:stop', onAgentTypingStop)
    socket.on('agent:message', onAgentMessage)
    socket.on('agent:conversation:updated', onConversationUpdate)
    socket.on('agent:conversation:new', onConversationUpdate)

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
      socket.off('agent:conversation:new', onConversationUpdate)
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

  const handleSend = async () => {
    if (!messageText.trim() || sending) return
    await sendMessage(messageText.trim())
    setMessageText('')
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
          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary rounded border-border"
              />
              <span className="text-xs text-muted-foreground">Otomatik Çeviri</span>
            </label>
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-6">
              <p className="text-sm text-destructive">Hata: {error.message}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">Henüz sohbet yok</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Yeni ziyaretçi mesajları burada görünecek
              </p>
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
                  <MessageBubble key={msg.id} message={msg} autoTranslate={autoTranslate} />
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
                {aiError && (
                  <span className="text-[11px] text-destructive truncate">{aiError}</span>
                )}
              </div>
              <div className="flex items-end gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesaj yazın..."
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sending}
                  className="w-11 h-11 bg-primary hover:bg-primary-hover disabled:bg-muted-foreground/30 disabled:cursor-not-allowed text-primary-foreground rounded-xl flex items-center justify-center transition shrink-0 shadow-brand"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}