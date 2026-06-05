'use client'

import { useState, useRef, useEffect } from 'react'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useMessages } from '@/lib/hooks/use-messages'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket-client'

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
    OPEN: 'bg-green-500',
    PENDING: 'bg-yellow-500',
    RESOLVED: 'bg-gray-400',
    CLOSED: 'bg-gray-300',
  }

  const name = conversation.visitor.name || conversation.visitor.email?.split('@')[0] || 'Anonim'
  const initial = name.charAt(0).toUpperCase()

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-start gap-3 border-b border-[#E5E0F0] dark:border-gray-700/50 hover:bg-[#F5F3FF] dark:hover:bg-gray-700/50 transition text-left ${
        selected ? 'bg-[#6C3CE1]/5 dark:bg-[#6C3CE1]/10 border-l-2 border-l-[#6C3CE1]' : ''
      }`}
    >
      <div className="relative shrink-0">
        {conversation.visitor.avatarUrl ? (
          <img src={conversation.visitor.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C3CE1]/20 to-[#8B5CF6]/20 flex items-center justify-center text-sm font-semibold text-[#6C3CE1] dark:text-[#A78BFA]">
            {initial}
          </div>
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${statusColor[conversation.status] || 'bg-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{name}</span>
          <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(conversation.lastMessageAt)}</span>
        </div>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {conversation.lastMessagePreview || 'Henüz mesaj yok'}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="w-5 h-5 bg-[#6C3CE1] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-md shadow-[#6C3CE1]/30">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────

function MessageBubble({ message, autoTranslate }: { message: {
  id: string
  content: string
  type: string
  senderType: string
  createdAt: string
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
        <span className="text-xs text-gray-400 bg-[#EDE9FE] dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isVisitor ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[70%] ${isVisitor ? 'order-1' : 'order-2'}`}>
        {(isBot) && (
          <span className="text-[10px] text-gray-400 ml-1 mb-0.5 block">
            🤖 Bot
          </span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          isVisitor
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-[#E5E0F0] dark:border-gray-700'
            : 'bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] text-white rounded-br-sm shadow-md shadow-[#6C3CE1]/20'
        }`}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {showTranslate && translatedText && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 pt-1.5 border-t border-[#E5E0F0] dark:border-gray-600 italic">
              🌐 {translatedText}
            </p>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isVisitor ? 'ml-1' : 'mr-1 justify-end'}`}>
          <span className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</span>
          {isVisitor && (
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="text-[10px] text-gray-400 hover:text-[#6C3CE1] transition disabled:opacity-50"
              title="Türkçe'ye çevir"
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
  const { activeWebsite } = useActiveWebsite()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'PENDING' | 'RESOLVED'>('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [typingPreview, setTypingPreview] = useState<{ conversationId: string; content: string } | null>(null)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, total, isLoading, error } = useConversations({
    status: filter,
    search: search || undefined,
    page: 1,
    limit: 50,
  })

  const { messages, isLoading: messagesLoading, sendMessage, sending } = useMessages(selectedId)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket connection for typing preview
  useEffect(() => {
    const socket = connectSocket()

    socket.on('visitor:typing-preview', (data: { conversationId: string; content: string }) => {
      setTypingPreview(data)
    })

    socket.on('visitor:typing-preview:clear', (data: { conversationId: string }) => {
      setTypingPreview((prev) => prev?.conversationId === data.conversationId ? null : prev)
    })

    socket.on('agent:typing:stop', (data: { conversationId: string }) => {
      setTypingPreview((prev) => prev?.conversationId === data.conversationId ? null : prev)
    })

    if (activeWebsite) {
      socket.emit('agent:auth', {
        userId: 'inbox-agent',
        websiteIds: [activeWebsite.id],
      })
    }

    return () => {
      disconnectSocket()
    }
  }, [activeWebsite])

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

  const selectedConversation = conversations.find(c => c.id === selectedId)

  return (
    <div className="h-screen flex">
      {/* Conversation List */}
      <div className="w-96 border-r border-[#E5E0F0] dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E0F0] dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Gelen Kutusu</h1>
            {total > 0 && (
              <span className="text-xs text-gray-400 bg-[#EDE9FE] dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {total} sohbet
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {([
              { key: 'all' as const, label: 'Tümü' },
              { key: 'OPEN' as const, label: 'Açık' },
              { key: 'PENDING' as const, label: 'Bekleyen' },
              { key: 'RESOLVED' as const, label: 'Çözülen' },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  filter === f.key
                    ? 'bg-[#6C3CE1] text-white shadow-md shadow-[#6C3CE1]/30'
                    : 'bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 hover:bg-[#DDD6FE] dark:hover:bg-gray-600'
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
                className="w-3.5 h-3.5 text-[#6C3CE1] rounded border-gray-300 focus:ring-[#6C3CE1]"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Otomatik Çeviri</span>
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sohbet ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F3FF] dark:bg-gray-900 border border-[#E5E0F0] dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-6">
              <p className="text-sm text-red-500">Hata: {error.message}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 bg-[#EDE9FE] dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Henüz sohbet yok</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
      <div className="flex-1 flex flex-col bg-[#F5F3FF] dark:bg-gray-900">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#EDE9FE] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sohbet seçin</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Detayları görmek için bir sohbet seçin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b border-[#E5E0F0] dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C3CE1]/20 to-[#8B5CF6]/20 flex items-center justify-center text-sm font-semibold text-[#6C3CE1] dark:text-[#A78BFA]">
                {(selectedConversation.visitor.name || selectedConversation.visitor.email || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                  {selectedConversation.visitor.name || selectedConversation.visitor.email?.split('@')[0] || 'Anonim'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedConversation.status === 'OPEN' ? 'bg-green-500' :
                    selectedConversation.status === 'PENDING' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedConversation.status === 'OPEN' ? 'Açık' :
                     selectedConversation.status === 'PENDING' ? 'Bekliyor' :
                     selectedConversation.status === 'RESOLVED' ? 'Çözüldü' : 'Kapalı'}
                  </span>
                  {selectedConversation.visitor.email && (
                    <span className="text-xs text-gray-400">· {selectedConversation.visitor.email}</span>
                  )}
                </div>
              </div>
              {selectedConversation.assignedTo && (
                <div className="text-xs text-gray-400 bg-[#EDE9FE] dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {selectedConversation.assignedTo.name || 'Temsilci'}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-gray-400 mt-8">
                  Henüz mesaj yok
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} autoTranslate={autoTranslate} />
                ))
              )}
              {typingPreview && typingPreview.conversationId === selectedId && (
                <div className="flex justify-start">
                  <div className="max-w-[70%]">
                    <div className="px-4 py-2.5 rounded-2xl text-sm bg-white dark:bg-gray-800 text-gray-400 italic border border-[#E5E0F0] dark:border-gray-700 rounded-bl-sm">
                      {typingPreview.content}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#E5E0F0] dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesaj yazın..."
                    className="w-full px-4 py-3 bg-[#F5F3FF] dark:bg-gray-900 border border-[#E5E0F0] dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition text-sm"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sending}
                  className="w-10 h-10 bg-[#6C3CE1] hover:bg-[#5B2FC5] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition shrink-0 shadow-md shadow-[#6C3CE1]/30"
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