'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useAdminInboxConversations, useAdminInboxMessages } from '@/lib/hooks/use-admin-inbox'
import { useInboxSoundAlert } from '@/lib/hooks/use-inbox-sound-alert'
import { connectSocket, retainSocket, releaseSocket } from '@/lib/socket-client'

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'şimdi'
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`
  return `${Math.floor(diff / 86400)}g`
}

export function AdminInboxPanel() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [marketingSite, setMarketingSite] = useState<{
    websiteId: string
    name: string
    domain: string | null
  } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const loadSetup = () => {
    setLoadError(null)
    setMarketingSite(null)
    return fetch('/api/admin/inbox/setup', { credentials: 'include' })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) {
          const msg = [d.error, d.detail, d.hint].filter(Boolean).join(' — ')
          throw new Error(msg || 'Kurulum başarısız')
        }
        setMarketingSite(d)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Hata'))
  }

  useEffect(() => {
    connectSocket()
    loadSetup()
  }, [])

  const websiteId = marketingSite?.websiteId
  const { conversations, isLoading, error, mutate: mutateConversations } = useAdminInboxConversations(
    !!marketingSite
  )
  const { messages, sendMessage, sending, mutate: mutateMessages } = useAdminInboxMessages(selectedId)

  useInboxSoundAlert(conversations, soundOn)

  const selected = conversations.find((c) => c.id === selectedId)

  useEffect(() => {
    const fromUrl = searchParams.get('conversation')
    if (fromUrl) setSelectedId(fromUrl)
  }, [searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket — guchat.org widget mesajları anlık gelsin
  useEffect(() => {
    if (!session?.user?.id || !websiteId) return
    const socket = retainSocket()
    if (!socket) return

    const auth = () => {
      socket.emit('agent:auth', { userId: session.user.id, websiteIds: [websiteId] })
    }
    const onMessage = () => {
      mutateConversations()
      if (selectedIdRef.current) mutateMessages()
    }
    const onNew = (data: { conversationId: string }) => {
      mutateConversations()
      setSelectedId((cur) => cur ?? data.conversationId)
    }

    socket.on('connect', auth)
    socket.on('agent:message', onMessage)
    socket.on('agent:conversation:new', onNew)
    socket.on('agent:conversation:updated', onMessage)
    if (socket.connected) auth()

    return () => {
      socket.off('connect', auth)
      socket.off('agent:message', onMessage)
      socket.off('agent:conversation:new', onNew)
      socket.off('agent:conversation:updated', onMessage)
      releaseSocket()
    }
  }, [session?.user?.id, websiteId, mutateConversations, mutateMessages])

  useEffect(() => {
    if (!selectedId || !session?.user?.id) return
    const socket = retainSocket()
    if (!socket) return
    const join = () => socket.emit('agent:join-conversation', { conversationId: selectedId })
    if (socket.connected) join()
    else socket.on('connect', join)
    return () => {
      socket.off('connect', join)
      releaseSocket()
    }
  }, [selectedId, session?.user?.id])

  const handleSend = async () => {
    if (!messageText.trim() || sending) return
    setSendError(null)
    try {
      await sendMessage(messageText.trim())
      setMessageText('')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Gönderilemedi')
    }
  }

  if (loadError) {
    return (
      <div className="p-8 text-center text-red-400 space-y-3">
        <p className="font-medium">{loadError}</p>
        <button
          type="button"
          onClick={() => loadSetup()}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
        >
          Yeniden Kur
        </button>
      </div>
    )
  }

  if (!marketingSite) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  return (
    <div className="flex flex-col flex-1 min-h-0 text-white">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-[#1A1D2E]">
        <div>
          <h1 className="text-lg font-bold">Gelen Kutusu</h1>
          <p className="text-xs text-gray-400">
            guchat.org widget · {marketingSite.name} · ID: {marketingSite.websiteId}
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {totalUnread} okunmamış
              </span>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={(e) => setSoundOn(e.target.checked)}
            className="rounded"
          />
          Sesli bildirim
        </label>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Liste */}
        <div className={`w-full lg:w-80 border-r border-white/10 flex flex-col bg-[#141625] ${selected ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-400 space-y-2">
                <p>{error.message}</p>
                <button
                  type="button"
                  onClick={() => mutateConversations()}
                  className="text-xs underline text-gray-400 hover:text-white"
                >
                  Tekrar dene
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Henüz mesaj yok. guchat.org sağ alttaki widget&apos;tan test mesajı gönderin.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition ${
                    selectedId === c.id ? 'bg-white/10 border-l-2 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {c.visitor.name || c.visitor.email?.split('@')[0] || 'Anonim'}
                    </span>
                    <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {c.lastMessagePreview || '—'}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="inline-block mt-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sohbet */}
        <div className={`flex-1 flex flex-col min-w-0 bg-[#0d0d1a] ${selected ? 'flex' : 'hidden lg:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Bir sohbet seçin
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button
                  type="button"
                  className="lg:hidden text-gray-400"
                  onClick={() => setSelectedId(null)}
                >
                  ←
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {selected.visitor.name || selected.visitor.email || 'Anonim'}
                  </p>
                  <p className="text-xs text-gray-500">{selected.status}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isAgent = m.senderType === 'AGENT'
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                          isAgent
                            ? 'bg-red-600 text-white'
                            : 'bg-white/10 text-gray-100'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-white/10">
                {sendError && <p className="text-xs text-red-400 mb-2">{sendError}</p>}
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Yanıt yazın..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-medium shrink-0"
                  >
                    {sending ? '...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
