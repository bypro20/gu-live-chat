'use client'

import { Suspense, useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, MessageSquare, AlertTriangle, Volume2, VolumeX } from 'lucide-react'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useMessages } from '@/lib/hooks/use-messages'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { connectSocket, retainSocket, releaseSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'
import {
  inboxCanAi,
  inboxCanCanned,
  inboxCanTranslate,
  inboxCanUpload,
} from '@/lib/inbox-features'
import { uploadInboxFile, attachmentContent } from '@/lib/inbox-upload'
import { ConversationListItem } from '@/components/inbox/conversation-list-item'
import { MessageThread } from '@/components/inbox/message-thread'
import { MessageComposer, type PendingUpload } from '@/components/inbox/message-composer'
import { TypingIndicator } from '@/components/inbox/typing-indicator'
import { VisitorContextPanel } from '@/components/inbox/visitor-context-panel'
import { ChatHeader } from '@/components/inbox/chat-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { INBOX_CHANNEL_FILTERS } from '@/lib/conversation-channels'
import { useInboxSoundAlert, playNewMessageSound } from '@/lib/hooks/use-inbox-sound-alert'
import { unlockInboxAudio } from '@/lib/inbox-sound'
import { ConnectionBadge } from '@/components/inbox/connection-badge'
import { useAgentLanguage } from '@/lib/hooks/use-agent-language'
import { LanguageBar } from '@/components/inbox/language-bar'
import { translateClient } from '@/lib/translate-client'
import { languagesDiffer, languageLabel, normalizeLangCode } from '@/lib/translate-languages'

function InboxPageContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const { activeWebsite, websites } = useActiveWebsite()
  const [allWebsites, setAllWebsites] = useState(false)

  const canTranslate = inboxCanTranslate(activeWebsite?.plan, userRole)
  const canAiAssistant = inboxCanAi(activeWebsite?.plan, userRole)
  const canCannedResponses = inboxCanCanned(activeWebsite?.plan, userRole)
  const canUpload = inboxCanUpload(activeWebsite?.plan, userRole)
  const { agentLang, setAgentLang } = useAgentLanguage()

  const [aiSuggestEnabled, setAiSuggestEnabled] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'PENDING' | 'RESOLVED'>('all')
  const [assignFilter, setAssignFilter] = useState<'all' | 'me' | 'unassigned'>('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [typingPreview, setTypingPreview] = useState<{ conversationId: string; content: string } | null>(null)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [detectedVisitorLang, setDetectedVisitorLang] = useState<string | null>(null)
  const [translatingOutgoing, setTranslatingOutgoing] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [cannedResponses, setCannedResponses] = useState<
    Array<{ id: string; title: string; content: string; shortcut: string | null }>
  >([])
  const [showCannedPicker, setShowCannedPicker] = useState(false)
  const [updatingConversation, setUpdatingConversation] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [uploading, setUploading] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [liveConnected, setLiveConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const selectedIdRef = useRef<string | null>(null)
  const soundOnRef = useRef(soundOn)
  selectedIdRef.current = selectedId
  soundOnRef.current = soundOn

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
    source: channelFilter,
    assignedTo: assignFilter === 'all' ? undefined : assignFilter,
    search: search || undefined,
    page: 1,
    limit: 50,
    allWebsites,
  })

  const inboxUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
  useInboxSoundAlert(conversations, soundOn, liveConnected)

  const { messages, isLoading: messagesLoading, sendMessage, sending, mutate: mutateMessages } =
    useMessages(selectedId)

  useEffect(() => {
    connectSocket()
    const unlock = () => unlockInboxAudio()
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!isSocketEnabled()) {
      setLiveConnected(false)
      return
    }
    const tick = () => setLiveConnected(isSocketConnected())
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [])

  const conversationFromUrl = searchParams.get('conversation')
  useEffect(() => {
    if (!conversationFromUrl || isLoading) return
    if (conversations.some((c) => c.id === conversationFromUrl)) setSelectedId(conversationFromUrl)
  }, [conversationFromUrl, conversations, isLoading])

  useEffect(() => {
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }
    prevMessageCountRef.current = messages.length
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

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
      playNewMessageSound(soundOnRef.current, data.senderType)

      if (selectedIdRef.current === data.conversationId) {
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
      }

      void mutateConversations()
    },
    [mutateMessages, mutateConversations]
  )

  useEffect(() => {
    if (!session?.user?.id || !activeWebsite?.websiteId) return
    const socket = retainSocket()
    if (!socket) return

    const onTypingPreview = (data: { conversationId: string; content: string }) =>
      setTypingPreview(data)
    const onTypingPreviewClear = (data: { conversationId: string }) =>
      setTypingPreview((prev) => (prev?.conversationId === data.conversationId ? null : prev))
    const onAgentTypingStop = (data: { conversationId: string }) =>
      setTypingPreview((prev) => (prev?.conversationId === data.conversationId ? null : prev))

    const authenticate = () => {
      socket.emit('agent:auth', {
        userId: session.user.id,
        websiteIds: allWebsites
          ? websites.map((w) => w.websiteId)
          : [activeWebsite.websiteId],
      })
    }

    socket.on('visitor:typing-preview', onTypingPreview)
    socket.on('visitor:typing-preview:clear', onTypingPreviewClear)
    socket.on('agent:typing:stop', onAgentTypingStop)
    socket.on('agent:message', handleIncomingMessage)
    socket.on('agent:conversation:updated', () => mutateConversations())
    socket.on('agent:conversation:new', (data: { conversationId: string }) => {
      mutateConversations()
      setSelectedId((c) => c ?? data.conversationId)
    })

    if (socket.connected) authenticate()
    else socket.on('connect', authenticate)

    return () => {
      socket.off('visitor:typing-preview', onTypingPreview)
      socket.off('visitor:typing-preview:clear', onTypingPreviewClear)
      socket.off('agent:typing:stop', onAgentTypingStop)
      socket.off('agent:message', handleIncomingMessage)
      socket.off('connect', authenticate)
      releaseSocket()
    }
  }, [
    activeWebsite?.websiteId,
    allWebsites,
    websites,
    session?.user?.id,
    handleIncomingMessage,
    mutateConversations,
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

  useEffect(() => {
    setDetectedVisitorLang(null)
    setPendingUpload(null)
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

  const selectedConversation = conversations.find((c) => c.id === selectedId)
  const visitorLang =
    selectedConversation?.visitorLang ||
    detectedVisitorLang ||
    null
  const normalizedVisitorLang = visitorLang ? normalizeLangCode(visitorLang) : null
  const translationPairActive =
    autoTranslate &&
    canTranslate &&
    normalizedVisitorLang &&
    languagesDiffer(agentLang, normalizedVisitorLang)

  useEffect(() => {
    if (selectedConversation?.visitorLang) {
      setDetectedVisitorLang(normalizeLangCode(selectedConversation.visitorLang))
      return
    }
    if (!autoTranslate || !canTranslate || !activeWebsite) return
    const visitorText = messages
      .filter((m) => m.senderType === 'VISITOR')
      .slice(-3)
      .map((m) => m.content)
      .join(' ')
      .trim()
      .slice(0, 300)
    if (!visitorText) return

    translateClient({
      text: visitorText,
      toLang: agentLang,
      websiteId: activeWebsite.websiteId,
    })
      .then((data) => {
        const lang = data.detectedLanguage
        if (lang && languagesDiffer(lang, agentLang)) {
          setDetectedVisitorLang(normalizeLangCode(lang))
        }
      })
      .catch(() => {})
  }, [autoTranslate, messages, canTranslate, activeWebsite, agentLang, selectedConversation?.visitorLang])

  const lastVisitorSentiment = messages.filter((m) => m.senderType === 'VISITOR').slice(-1)[0]?.sentiment

  const handleMessageChange = (value: string) => {
    setMessageText(value)
    setShowCannedPicker(canCannedResponses && value.startsWith('/'))
  }

  const handleFileSelect = async (file: File) => {
    if (!canUpload) return
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setPendingUpload({ file, previewUrl })
    setSendError(null)
  }

  const clearPendingUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl)
    setPendingUpload(null)
  }

  const handleSend = async () => {
    if (sending || uploading || !selectedId) return
    if (!messageText.trim() && !pendingUpload) return
    setSendError(null)

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
          websiteId: activeWebsite?.websiteId,
        })
        if (data.translatedText && data.translatedText !== textToSend) {
          textToSend = data.translatedText
        }
      } catch {
        /* original */
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
      setSendError(e instanceof Error ? e.message : 'Mesaj gönderilemedi')
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
      if (!res.ok) throw new Error(data.error || 'AI önerisi alınamadı')
      if (data.suggestion) setMessageText(data.suggestion)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI önerisi alınamadı')
    } finally {
      setAiSuggesting(false)
    }
  }

  const mapMessage = (
    m: (typeof messages)[0] & { sender?: { name?: string | null; image?: string | null } }
  ) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    senderType: m.senderType,
    createdAt: m.createdAt,
    sentiment: m.sentiment,
    senderName: m.sender?.name ?? null,
    senderImage: m.sender?.image ?? null,
    attachments: m.attachments?.map((a) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
      mimetype: a.mimetype,
      size: a.size,
    })),
  })

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-screen flex bg-background">
      {/* Sidebar */}
      <div
        className={`w-full lg:w-[340px] xl:w-[380px] border-r border-border flex-col bg-card shrink-0 ${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">Gelen Kutusu</h1>
              <ConnectionBadge connected={liveConnected} socketEnabled={isSocketEnabled()} />
              {inboxUnread > 0 && (
                <span className="text-xs font-medium text-primary tabular-nums">{inboxUnread}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {total > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">{total}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={soundOn ? 'Bildirim sesi açık' : 'Bildirim sesi kapalı'}
                onClick={() => {
                  setSoundOn((v) => !v)
                  if (!soundOn) unlockInboxAudio()
                }}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {websites.length > 1 && (
            <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setAllWebsites(false)}
                className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-md transition truncate ${
                  !allWebsites ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {activeWebsite?.name || 'Aktif'}
              </button>
              <button
                type="button"
                onClick={() => setAllWebsites(true)}
                className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-md transition ${
                  allWebsites ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Tüm siteler
              </button>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { key: 'all' as const, label: 'Tümü' },
                { key: 'me' as const, label: 'Bana' },
                { key: 'unassigned' as const, label: 'Atanmamış' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setAssignFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition ${
                  assignFilter === f.key
                    ? 'bg-muted text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { key: 'all' as const, label: 'Tümü' },
                { key: 'OPEN' as const, label: 'Açık' },
                { key: 'PENDING' as const, label: 'Bekleyen' },
                { key: 'RESOLVED' as const, label: 'Çözülen' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {INBOX_CHANNEL_FILTERS.map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={() => setChannelFilter(ch.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition ${
                  channelFilter === ch.key
                    ? 'bg-muted text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sohbet ara…"
              className="pl-9 h-10 bg-muted/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !activeWebsite ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Site yükleniyor…</p>
          ) : error ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="link" size="sm" onClick={() => mutateConversations()}>
                Tekrar dene
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">Henüz sohbet yok</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Widget&apos;tan gelen mesajlar burada görünür.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                selected={selectedId === conv.id}
                onClick={() => setSelectedId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={`flex-1 flex-col min-w-0 bg-muted/30 ${
          selectedConversation ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h2 className="text-lg font-semibold">Sohbet seçin</h2>
              <p className="text-sm text-muted-foreground mt-1">Detayları görmek için listeden bir sohbet açın</p>
            </div>
          </div>
        ) : (
          <>
            <ChatHeader
              conversation={selectedConversation}
              onBack={() => setSelectedId(null)}
              canTranslate={canTranslate}
              autoTranslate={autoTranslate}
              onToggleTranslate={() => setAutoTranslate((v) => !v)}
              detectedLang={normalizedVisitorLang}
              agentLang={agentLang}
              showAssign
              onAssignToMe={() => updateConversation({ assignedToId: session?.user?.id })}
              onResolve={
                selectedConversation.status !== 'RESOLVED' &&
                selectedConversation.status !== 'CLOSED'
                  ? () => updateConversation({ status: 'RESOLVED' })
                  : undefined
              }
              onReopen={
                selectedConversation.status === 'RESOLVED' ||
                selectedConversation.status === 'CLOSED'
                  ? () => updateConversation({ status: 'OPEN' })
                  : undefined
              }
              updating={updatingConversation}
              showVisitorLinks
              visitorId={selectedConversation.visitorId || selectedConversation.visitor?.id}
            />

            <LanguageBar
              agentLang={agentLang}
              onAgentLangChange={setAgentLang}
              visitorLang={normalizedVisitorLang}
              autoTranslate={autoTranslate}
              canTranslate={canTranslate}
            />

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className={`h-12 ${i % 2 ? 'ml-auto w-2/3' : 'w-2/3'} rounded-xl`} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground mt-8">Henüz mesaj yok</p>
              ) : (
                <MessageThread
                  messages={messages.map(mapMessage)}
                  autoTranslate={autoTranslate}
                  canTranslate={canTranslate}
                  websiteId={activeWebsite?.websiteId}
                  agentLang={agentLang}
                />
              )}
              {typingPreview && typingPreview.conversationId === selectedId && (
                <TypingIndicator preview={typingPreview.content} />
              )}
              {lastVisitorSentiment === 'NEGATIVE' && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-destructive py-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ziyaretçi olumsuz ton — öncelik verin
                </div>
              )}
              {aiError && <p className="text-xs text-destructive text-center">{aiError}</p>}
              <div ref={messagesEndRef} />
            </div>

            <MessageComposer
              value={messageText}
              onChange={handleMessageChange}
              onSend={handleSend}
              onFileSelect={handleFileSelect}
              pendingUpload={pendingUpload}
              onClearUpload={clearPendingUpload}
              sending={sending}
              translating={translatingOutgoing}
              uploading={uploading}
              canUpload={canUpload}
              canCanned={canCannedResponses}
              canAi={canAiAssistant}
              aiEnabled={aiSuggestEnabled}
              onAiSuggest={handleAiSuggest}
              aiSuggesting={aiSuggesting}
              cannedResponses={cannedResponses}
              showCannedPicker={showCannedPicker}
              onSelectCanned={(c) => {
                setMessageText(c)
                setShowCannedPicker(false)
              }}
              autoTranslate={autoTranslate}
              detectedLang={normalizedVisitorLang}
              agentLang={agentLang}
              sendError={sendError}
              placeholder={
                translationPairActive && normalizedVisitorLang
                  ? `${languageLabel(agentLang)} yazın — ${languageLabel(normalizedVisitorLang)}'ye çevrilir`
                  : canCannedResponses
                    ? 'Mesaj yazın… (/ hazır cevap)'
                    : 'Mesaj yazın…'
              }
            />
          </>
        )}
      </div>

      {selectedConversation && (
        <VisitorContextPanel conversation={selectedConversation} />
      )}
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Gelen kutusu yükleniyor…
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  )
}
