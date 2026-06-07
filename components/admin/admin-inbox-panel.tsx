'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  useAdminInboxConversations,
  useAdminInboxMessages,
  type AdminMessage,
} from '@/lib/hooks/use-admin-inbox'
import { useInboxSoundAlert, playNewMessageSound } from '@/lib/hooks/use-inbox-sound-alert'
import {
  connectSocket,
  retainSocket,
  releaseSocket,
  isSocketConnected,
  isSocketEnabled,
} from '@/lib/socket-client'
import { unlockInboxAudio } from '@/lib/inbox-sound'

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
  const [liveConnected, setLiveConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<string | null>(null)
  const soundOnRef = useRef(soundOn)
  selectedIdRef.current = selectedId
  soundOnRef.current = soundOn

  const loadSetup = useCallback(() => {
    setLoadError(null)
    setMarketingSite(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    return fetch('/api/admin/inbox/setup', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (r) => {
        clearTimeout(timeout)
        const d = await r.json()
        if (!r.ok) {
          const msg = [d.error, d.detail, d.hint].filter(Boolean).join(' — ')
          throw new Error(msg || 'Kurulum başarısız')
        }
        setMarketingSite(d)
      })
      .catch((e) => {
        clearTimeout(timeout)
        if (e instanceof Error && e.name === 'AbortError') {
          setLoadError('Gelen kutusu zaman aşımına uğradı. Yeniden deneyin.')
        } else {
          setLoadError(e instanceof Error ? e.message : 'Gelen kutusu açılamadı')
        }
      })
  }, [])

  useEffect(() => {
    connectSocket()
    loadSetup()
    const unlock = () => unlockInboxAudio()
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [loadSetup])

  const websiteId = marketingSite?.websiteId
  const { conversations, isLoading, error, mutate: mutateConversations } =
    useAdminInboxConversations(!!marketingSite)
  const { messages, sendMessage, sending, mutate: mutateMessages } =
    useAdminInboxMessages(selectedId)

  useInboxSoundAlert(conversations, soundOn)

  const selected = conversations.find((c) => c.id === selectedId)

  useEffect(() => {
    const fromUrl = searchParams.get('conversation')
    if (fromUrl) setSelectedId(fromUrl)
  }, [searchParams])

  useEffect(() => {
    if (selectedId || conversations.length === 0) return
    const fromUrl = searchParams.get('conversation')
    if (fromUrl) return
    const firstUnread = conversations.find((c) => c.unreadCount > 0)
    setSelectedId((firstUnread ?? conversations[0]).id)
  }, [conversations, selectedId, searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Bağlantı durumu göstergesi
  useEffect(() => {
    if (!isSocketEnabled()) {
      setLiveConnected(false)
      return
    }
    const tick = () => setLiveConnected(isSocketConnected())
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [])

  const handleIncomingMessage = useCallback(
    (data: {
      id: string
      conversationId: string
      content: string
      type: string
      senderType: string
      senderId?: string | null
      createdAt: string
    }) => {
      const isSelected = selectedIdRef.current === data.conversationId
      playNewMessageSound(
        soundOnRef.current,
        data.senderType,
        isSelected
      )

      if (isSelected) {
        mutateMessages((current) => {
          if (!current) return current
          if (current.messages.some((m) => m.id === data.id)) return current
          const incoming: AdminMessage = {
            id: data.id,
            conversationId: data.conversationId,
            content: data.content,
            type: data.type,
            senderType: data.senderType,
            senderId: data.senderId ?? null,
            createdAt: data.createdAt,
            readAt: null,
            attachments: [],
          }
          return { ...current, messages: [...current.messages, incoming] }
        }, { revalidate: false })
      }

      void mutateConversations()
      if (!selectedIdRef.current && data.conversationId) {
        setSelectedId(data.conversationId)
      }
    },
    [mutateMessages, mutateConversations]
  )

  // Socket — widget mesajları anlık
  useEffect(() => {
    if (!session?.user?.id || !websiteId) return
    const socket = retainSocket()
    if (!socket) return

    const auth = () => {
      socket.emit('agent:auth', { userId: session.user.id, websiteIds: [websiteId] })
    }

    const onMessage = (data: {
      id: string
      conversationId: string
      content: string
      type: string
      senderType: string
      senderId?: string | null
      createdAt: string
    }) => {
      handleIncomingMessage(data)
    }

    const onNew = (data: { conversationId: string }) => {
      void mutateConversations()
      setSelectedId((cur) => cur ?? data.conversationId)
    }

    const onUpdated = () => {
      void mutateConversations()
      if (selectedIdRef.current) void mutateMessages()
    }

    socket.on('connect', auth)
    socket.on('agent:message', onMessage)
    socket.on('agent:conversation:new', onNew)
    socket.on('agent:conversation:updated', onUpdated)
    if (socket.connected) auth()

    return () => {
      socket.off('connect', auth)
      socket.off('agent:message', onMessage)
      socket.off('agent:conversation:new', onNew)
      socket.off('agent:conversation:updated', onUpdated)
      releaseSocket()
    }
  }, [
    session?.user?.id,
    websiteId,
    mutateConversations,
    mutateMessages,
    handleIncomingMessage,
  ])

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
    unlockInboxAudio()
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

  if (!marketingSite && !loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Gelen kutusu yükleniyor…</p>
        <button
          type="button"
          onClick={() => loadSetup()}
          className="text-xs underline hover:text-white"
        >
          Çok uzun sürüyorsa yeniden dene
        </button>
      </div>
    )
  }

  if (!marketingSite) return null

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)
  const connectionLabel = liveConnected
    ? 'Canlı bağlantı'
    : isSocketEnabled()
      ? 'Bağlanıyor…'
      : 'Hızlı senkron (~1sn)'

  return (
    <div className="flex flex-col flex-1 min-h-0 text-white">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-[#1A1D2E]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Gelen Kutusu</h1>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                liveConnected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {connectionLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            guchat.org widget · {marketingSite.name}
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {totalUnread} okunmamış
              </span>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={(e) => {
              setSoundOn(e.target.checked)
              if (e.target.checked) unlockInboxAudio()
            }}
            className="rounded"
          />
          🔊 Sesli bildirim
        </label>
      </div>

      <div className="flex flex-1 min-h-0">
        <div
          className={`w-full lg:w-80 border-r border-white/10 flex flex-col bg-[#141625] ${
            selected ? 'hidden lg:flex' : 'flex'
          }`}
        >
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
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {timeAgo(c.lastMessageAt)}
                    </span>
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

        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#0d0d1a] ${
            selected ? 'flex' : 'hidden lg:flex'
          }`}
        >
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
                {messages.length === 0 && !sending ? (
                  <p className="text-center text-gray-500 text-sm py-8">Mesaj yükleniyor…</p>
                ) : (
                  messages.map((m) => {
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
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className="text-[10px] opacity-50 mt-1 text-right">
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
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
                    placeholder="Yanıt yazın…"
                    rows={2}
                    className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-medium shrink-0"
                  >
                    {sending ? '…' : 'Gönder'}
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
