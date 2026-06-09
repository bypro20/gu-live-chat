'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Volume2, VolumeX, MessageSquare } from 'lucide-react'
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
import { uploadInboxFile, attachmentContent } from '@/lib/inbox-upload'
import { ConversationListItem } from '@/components/inbox/conversation-list-item'
import { MessageBubble } from '@/components/inbox/message-bubble'
import { MessageComposer, type PendingUpload } from '@/components/inbox/message-composer'
import { ChatHeader } from '@/components/inbox/chat-header'
import { ConnectionBadge } from '@/components/inbox/connection-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgentLanguage } from '@/lib/hooks/use-agent-language'
import { LanguageBar } from '@/components/inbox/language-bar'
import { translateClient } from '@/lib/translate-client'
import { languagesDiffer, languageLabel, normalizeLangCode } from '@/lib/translate-languages'

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
  const { agentLang, setAgentLang } = useAgentLanguage()
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [detectedVisitorLang, setDetectedVisitorLang] = useState<string | null>(null)
  const [translatingOutgoing, setTranslatingOutgoing] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [uploading, setUploading] = useState(false)
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
          setLoadError('Gelen kutusu zaman aşımına uğradı.')
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

  useInboxSoundAlert(conversations, soundOn, liveConnected)

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

  useEffect(() => {
    setDetectedVisitorLang(null)
    setPendingUpload(null)
  }, [selectedId])

  const selected = conversations.find((c) => c.id === selectedId)
  const visitorLang = selected?.visitorLang || detectedVisitorLang || null
  const normalizedVisitorLang = visitorLang ? normalizeLangCode(visitorLang) : null
  const translationPairActive =
    autoTranslate && normalizedVisitorLang && languagesDiffer(agentLang, normalizedVisitorLang)

  useEffect(() => {
    if (selected?.visitorLang) {
      setDetectedVisitorLang(normalizeLangCode(selected.visitorLang))
      return
    }
    if (!autoTranslate || !websiteId) return
    const visitorText = messages
      .filter((m) => m.senderType === 'VISITOR')
      .slice(-3)
      .map((m) => m.content)
      .join(' ')
      .trim()
      .slice(0, 300)
    if (!visitorText) return

    translateClient({ text: visitorText, toLang: agentLang, websiteId })
      .then((data) => {
        const lang = data.detectedLanguage
        if (lang && languagesDiffer(lang, agentLang)) {
          setDetectedVisitorLang(normalizeLangCode(lang))
        }
      })
      .catch(() => {})
  }, [autoTranslate, messages, websiteId, agentLang, selected?.visitorLang])

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
      playNewMessageSound(soundOnRef.current, data.senderType)

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

  useEffect(() => {
    if (!session?.user?.id || !websiteId) return
    const socket = retainSocket()
    if (!socket) return

    const auth = () => {
      socket.emit('agent:auth', { userId: session.user.id, websiteIds: [websiteId] })
    }

    socket.on('connect', auth)
    socket.on('agent:message', handleIncomingMessage)
    socket.on('agent:conversation:new', (data: { conversationId: string }) => {
      void mutateConversations()
      setSelectedId((cur) => cur ?? data.conversationId)
    })
    socket.on('agent:conversation:updated', () => {
      void mutateConversations()
      if (selectedIdRef.current) void mutateMessages()
    })
    if (socket.connected) auth()

    return () => {
      socket.off('connect', auth)
      socket.off('agent:message', handleIncomingMessage)
      releaseSocket()
    }
  }, [session?.user?.id, websiteId, mutateConversations, mutateMessages, handleIncomingMessage])

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

  const clearPendingUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl)
    setPendingUpload(null)
  }

  const handleFileSelect = async (file: File) => {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setPendingUpload({ file, previewUrl })
    setSendError(null)
  }

  const handleSend = async () => {
    if (sending || uploading) return
    if (!messageText.trim() && !pendingUpload) return
    setSendError(null)
    unlockInboxAudio()

    let textToSend = messageText.trim()
    let attachmentPayload: ReturnType<typeof attachmentContent> | null = null
    let uploadMeta: Awaited<ReturnType<typeof uploadInboxFile>> | null = null

    if (pendingUpload) {
      setUploading(true)
      try {
        uploadMeta = await uploadInboxFile(pendingUpload.file)
        attachmentPayload = attachmentContent(uploadMeta, textToSend)
        textToSend = attachmentPayload.content
      } catch (e) {
        setSendError(e instanceof Error ? e.message : 'Dosya yüklenemedi')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    if (translationPairActive && normalizedVisitorLang && textToSend) {
      setTranslatingOutgoing(true)
      try {
        const data = await translateClient({
          text: textToSend,
          toLang: normalizedVisitorLang,
          fromLang: agentLang,
          websiteId,
        })
        if (data.translatedText) textToSend = data.translatedText
      } catch {
        /* ignore */
      } finally {
        setTranslatingOutgoing(false)
      }
    }

    try {
      await sendMessage(textToSend, {
        type: attachmentPayload?.type,
        attachment: uploadMeta
          ? {
              url: uploadMeta.url,
              fileName: uploadMeta.fileName,
              fileSize: uploadMeta.fileSize,
              mimeType: uploadMeta.mimeType,
            }
          : undefined,
      })
      setMessageText('')
      clearPendingUpload()
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Gönderilemedi')
    }
  }

  const mapMessage = (m: AdminMessage) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    senderType: m.senderType,
    createdAt: m.createdAt,
    attachments: m.attachments?.map((a) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
      mimetype: a.mimetype,
      size: a.size,
    })),
  })

  if (loadError) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-destructive font-medium">{loadError}</p>
        <Button onClick={() => loadSetup()}>Yeniden dene</Button>
      </div>
    )
  }

  if (!marketingSite && !loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <p className="text-sm text-muted-foreground">Gelen kutusu yükleniyor…</p>
      </div>
    )
  }

  if (!marketingSite) return null

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-card shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Gelen Kutusu</h1>
            <ConnectionBadge connected={liveConnected} socketEnabled={isSocketEnabled()} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {marketingSite.name}
            {totalUnread > 0 && (
              <span className="ml-2 text-primary font-medium">{totalUnread} okunmamış</span>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => {
            setSoundOn((v) => !v)
            if (!soundOn) unlockInboxAudio()
          }}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          Ses
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div
          className={`w-full lg:w-[340px] border-r border-border flex flex-col bg-card shrink-0 ${
            selected ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-destructive space-y-2">
                <p>{error.message}</p>
                <Button variant="link" size="sm" onClick={() => mutateConversations()}>
                  Tekrar dene
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Henüz mesaj yok</p>
              </div>
            ) : (
              conversations.map((c) => (
                <ConversationListItem
                  key={c.id}
                  conversation={c}
                  selected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col min-w-0 bg-muted/30 ${
            selected ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Bir sohbet seçin
            </div>
          ) : (
            <>
              <ChatHeader
                conversation={selected}
                onBack={() => setSelectedId(null)}
                canTranslate
                autoTranslate={autoTranslate}
                onToggleTranslate={() => setAutoTranslate((v) => !v)}
                detectedLang={normalizedVisitorLang}
                agentLang={agentLang}
              />

              <LanguageBar
                agentLang={agentLang}
                onAgentLangChange={setAgentLang}
                visitorLang={normalizedVisitorLang}
                autoTranslate={autoTranslate}
                canTranslate
              />

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && !sending ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Mesaj yükleniyor…</p>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={mapMessage(m)}
                      autoTranslate={autoTranslate}
                      canTranslate
                      websiteId={websiteId}
                      agentLang={agentLang}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <MessageComposer
                value={messageText}
                onChange={setMessageText}
                onSend={handleSend}
                onFileSelect={handleFileSelect}
                pendingUpload={pendingUpload}
                onClearUpload={clearPendingUpload}
                sending={sending}
                translating={translatingOutgoing}
                uploading={uploading}
                canUpload
                autoTranslate={autoTranslate}
                detectedLang={normalizedVisitorLang}
                agentLang={agentLang}
                sendError={sendError}
                placeholder={
                  translationPairActive && normalizedVisitorLang
                    ? `${languageLabel(agentLang)} yazın — ${languageLabel(normalizedVisitorLang)}'ye çevrilir`
                    : 'Yanıt yazın…'
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
