'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Volume2, VolumeX, MessageSquare, Search, AlertTriangle } from 'lucide-react'
import { useInboxMessageScroll } from '@/lib/hooks/use-inbox-message-scroll'
import { useInboxMobileChat, useInboxNarrowLayout, isInboxNarrowLayout, INBOX_CHAT_PANEL_MOBILE } from '@/lib/hooks/use-inbox-mobile-chat'
import {
  useAdminInboxConversations,
  useAdminInboxMessages,
  type AdminMessage,
} from '@/lib/hooks/use-admin-inbox'
import { useInboxSoundAlert } from '@/lib/hooks/use-inbox-sound-alert'
import {
  startPersistentInboxAlert,
  stopPersistentInboxAlertsForConversation,
  subscribePersistentInboxAlerts,
  getPersistentInboxAlerts,
  type PersistentInboxAlert,
} from '@/lib/inbox-persistent-alert'
import { showDesktopNotification } from '@/lib/inbox-sound'
import { InboxPersistentAlertBar } from '@/components/inbox/inbox-persistent-alert-bar'
import {
  connectSocket,
  retainSocket,
  releaseSocket,
  isSocketConnected,
  isSocketEnabled,
} from '@/lib/socket-client'
import { fetchAgentSocketAuth } from '@/lib/hooks/use-agent-socket-auth'
import { unlockInboxAudio } from '@/lib/inbox-sound'
import { uploadInboxFile, attachmentContent } from '@/lib/inbox-upload'
import { ConversationListItem } from '@/components/inbox/conversation-list-item'
import { MessageThread } from '@/components/inbox/message-thread'
import { MessageComposer, type PendingUpload } from '@/components/inbox/message-composer'
import { ChatHeader } from '@/components/inbox/chat-header'
import { ConnectionBadge } from '@/components/inbox/connection-badge'
import { InboxMessageArea } from '@/components/inbox/inbox-message-area'
import { VisitorContextPanel } from '@/components/inbox/visitor-context-panel'
import { LanguageBar } from '@/components/inbox/language-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgentLanguage } from '@/lib/hooks/use-agent-language'
import { useInboxAutoTranslate } from '@/lib/hooks/use-inbox-auto-translate'
import { translateClient } from '@/lib/translate-client'
import { languagesDiffer, languageLabel, normalizeLangCode } from '@/lib/translate-languages'
import { INBOX_CHANNEL_FILTERS } from '@/lib/conversation-channels'
import { resolveInboxPrimary } from '@/lib/inbox-theme'
import { InboxBulkActionsBar } from '@/components/inbox/inbox-bulk-actions'
import { useInboxDelete } from '@/lib/hooks/use-inbox-delete'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import type { InboxConversation } from '@/components/inbox/types'

export function AdminInboxPanel() {
  const i = useDashboardI18n().inbox
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNarrow = useInboxNarrowLayout()
  const { data: session } = useSession()
  const [marketingSite, setMarketingSite] = useState<{
    websiteId: string
    name: string
    domain: string | null
    primaryColor?: string | null
  } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'PENDING' | 'RESOLVED'>('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const [liveConnected, setLiveConnected] = useState(false)
  const [updatingConversation, setUpdatingConversation] = useState(false)
  const { agentLang, setAgentLang } = useAgentLanguage()
  const { autoTranslate, toggleAutoTranslate } = useInboxAutoTranslate(true)
  const [detectedVisitorLang, setDetectedVisitorLang] = useState<string | null>(null)
  const [translatingOutgoing, setTranslatingOutgoing] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [uploading, setUploading] = useState(false)
  const [persistentAlerts, setPersistentAlerts] = useState<PersistentInboxAlert[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [aiSuggestEnabled, setAiSuggestEnabled] = useState(true)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [handoffSummary, setHandoffSummary] = useState<string | null>(null)
  const [cannedResponses, setCannedResponses] = useState<
    Array<{ id: string; title: string; content: string; shortcut: string | null }>
  >([])
  const [showCannedPicker, setShowCannedPicker] = useState(false)
  const { deleting, deleteConversation, deleteConversations, deleteMessage } = useInboxDelete('admin')
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
  const inboxPrimary = resolveInboxPrimary(marketingSite?.primaryColor)
  const { conversations, isLoading, error, mutate: mutateConversations } =
    useAdminInboxConversations(!!marketingSite)
  const { messages, sendMessage, sending, isLoading: messagesLoading, mutate: mutateMessages } =
    useAdminInboxMessages(selectedId)

  const { containerRef: messageScrollRef, handleScroll: onMessageScroll } = useInboxMessageScroll(
    messages.length,
    selectedId,
  )

  useInboxMobileChat(isNarrow && !!selectedId)

  useInboxSoundAlert(conversations, false, liveConnected)

  useEffect(() => {
    setPersistentAlerts(getPersistentInboxAlerts())
    return subscribePersistentInboxAlerts(() => {
      setPersistentAlerts(getPersistentInboxAlerts())
    })
  }, [])

  useEffect(() => {
    if (selectedId) stopPersistentInboxAlertsForConversation(selectedId)
  }, [selectedId])

  const triggerPersistentAlert = useCallback(
    (alert: {
      id: string
      label: string
      reason: PersistentInboxAlert['reason']
      preview?: string
      conversationId?: string
    }) => {
      if (!soundOnRef.current) return
      unlockInboxAudio()
      startPersistentInboxAlert(alert)
      showDesktopNotification(alert.label, alert.preview || 'Yeni aktivite')
    },
    []
  )

  const openPersistentAlert = useCallback((alert: PersistentInboxAlert) => {
    const conversationId = alert.conversationId || (alert.id.startsWith('visitor:') ? null : alert.id)
    if (conversationId) {
      setSelectedId(conversationId)
      if (isInboxNarrowLayout()) {
        router.replace(`/admin/inbox?conversation=${encodeURIComponent(conversationId)}`, { scroll: false })
      }
    }
    stopPersistentInboxAlertsForConversation(conversationId || alert.id)
  }, [router])

  const showInboxList = useCallback(() => {
    setSelectedId(null)
    if (searchParams.get('conversation')) {
      router.replace('/admin/inbox', { scroll: false })
    }
  }, [router, searchParams])

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return conversations.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (channelFilter !== 'all' && c.source !== channelFilter) return false
      if (!q) return true
      const hay = [
        c.visitor.name,
        c.visitor.email,
        c.lastMessagePreview,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [conversations, filter, channelFilter, search])

  const inboxUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  useEffect(() => {
    const fromUrl = searchParams.get('conversation')
    if (fromUrl) {
      setSelectedId(fromUrl)
      return
    }
    // Mobilde gelen kutusuna girince önce konuşma listesi gösterilsin
    if (!isInboxNarrowLayout()) {
      setSelectedId(null)
    }
  }, [pathname, searchParams])

  useEffect(() => {
    if (selectedId || filteredConversations.length === 0) return
    const fromUrl = searchParams.get('conversation')
    if (fromUrl) return
    // Masaüstünde yan yana görünüm için ilk okunmamışı seç; mobil/tablet'te listeyi kilitleme
    if (isInboxNarrowLayout()) return
    const firstUnread = filteredConversations.find((c) => c.unreadCount > 0)
    setSelectedId((firstUnread ?? filteredConversations[0]).id)
  }, [filteredConversations, selectedId, searchParams])

  useEffect(() => {
    const showList = () => {
      if (isInboxNarrowLayout()) showInboxList()
    }
    window.addEventListener('admin-inbox-show-list', showList)
    return () => window.removeEventListener('admin-inbox-show-list', showList)
  }, [showInboxList])

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

  useEffect(() => {
    setDetectedVisitorLang(null)
    setPendingUpload(null)
    setAiError(null)
  }, [selectedId])

  useEffect(() => {
    if (!websiteId) {
      setAiSuggestEnabled(false)
      return
    }
    fetch(`/api/ai/config?websiteId=${websiteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { aiConfig?: { isActive?: boolean; autoSuggest?: boolean } } | null) => {
        setAiSuggestEnabled(!!data?.aiConfig?.isActive && data?.aiConfig?.autoSuggest !== false)
      })
      .catch(() => setAiSuggestEnabled(true))
  }, [websiteId])

  useEffect(() => {
    if (!websiteId) {
      setCannedResponses([])
      return
    }
    fetch(`/api/canned-responses?websiteId=${websiteId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCannedResponses(Array.isArray(data) ? data : []))
      .catch(() => setCannedResponses([]))
  }, [websiteId])

  useEffect(() => {
    if (!selectedId) {
      setHandoffSummary(null)
      return
    }
    fetch(`/api/conversations/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { aiHandoffSummary?: string | null } | null) => {
        setHandoffSummary(data?.aiHandoffSummary?.trim() || null)
      })
      .catch(() => setHandoffSummary(null))
  }, [selectedId])

  const selected = filteredConversations.find((c) => c.id === selectedId)
    ?? conversations.find((c) => c.id === selectedId)

  const selectedConversation: InboxConversation | undefined = selected
    ? {
        id: selected.id,
        status: selected.status,
        source: selected.source,
        visitorLang: selected.visitorLang,
        lastMessageAt: selected.lastMessageAt,
        lastMessagePreview: selected.lastMessagePreview,
        unreadCount: selected.unreadCount,
        visitorId: selected.visitorId,
        visitor: {
          id: selected.visitor.id,
          name: selected.visitor.name,
          email: selected.visitor.email,
          avatarUrl: selected.visitor.avatarUrl,
        },
      }
    : undefined

  const normalizedVisitorLang = (selected?.visitorLang || detectedVisitorLang)
    ? normalizeLangCode(selected?.visitorLang || detectedVisitorLang || '')
    : null
  const translationPairActive =
    autoTranslate && normalizedVisitorLang && languagesDiffer(agentLang, normalizedVisitorLang)

  useEffect(() => {
    if (selected?.visitorLang) {
      setDetectedVisitorLang(normalizeLangCode(selected.visitorLang))
      return
    }
    if (!autoTranslate || !websiteId) return
    const lastVisitor = messages.filter((m) => m.senderType === 'VISITOR').at(-1)
    const visitorText = lastVisitor?.content?.trim().slice(0, 300)
    if (!visitorText) return

    translateClient({ text: visitorText, toLang: agentLang, websiteId })
      .then((data) => {
        const lang = data.detectedLanguage
        if (!lang || !languagesDiffer(lang, agentLang)) return
        const normalized = normalizeLangCode(lang)
        setDetectedVisitorLang(normalized)
        if (selectedId && !selected?.visitorLang) {
          void fetch(`/api/conversations/${selectedId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorLang: normalized }),
          })
        }
      })
      .catch(() => {})
  }, [autoTranslate, messages, websiteId, agentLang, selected?.visitorLang, selectedId])

  const updateConversation = async (patch: { status?: string; assignedToId?: string | null }) => {
    if (!selectedId) return
    setUpdatingConversation(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const toggleConversationSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteConversation = async () => {
    if (!selectedId) return
    if (!window.confirm(i.confirmDeleteConversation)) return
    try {
      await deleteConversation(selectedId)
      setSelectedId(null)
      await mutateConversations()
    } catch (e) {
      console.error(e)
      setSendError(i.deleteFailed)
    }
  }

  const handleBulkDelete = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    if (!window.confirm(i.confirmBulkDelete(ids.length))) return
    try {
      await deleteConversations(ids)
      if (selectedId && ids.includes(selectedId)) setSelectedId(null)
      setSelectedIds(new Set())
      setSelectionMode(false)
      await mutateConversations()
    } catch (e) {
      console.error(e)
      setSendError(i.deleteFailed)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedId) return
    if (!window.confirm(i.confirmDeleteMessage)) return
    setDeletingMessageId(messageId)
    try {
      await deleteMessage(selectedId, messageId)
      await mutateMessages(
        (current) => {
          if (!current) return current
          return { ...current, messages: current.messages.filter((m) => m.id !== messageId) }
        },
        { revalidate: true }
      )
      await mutateConversations()
    } catch (e) {
      console.error(e)
      setSendError(i.deleteFailed)
    } finally {
      setDeletingMessageId(null)
    }
  }

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

      if (data.senderType === 'VISITOR' && !isSelected) {
        const conv = conversations.find((c) => c.id === data.conversationId)
        const name =
          conv?.visitor.name?.trim() ||
          conv?.visitor.email?.split('@')[0] ||
          'Ziyaretçi'
        triggerPersistentAlert({
          id: data.conversationId,
          conversationId: data.conversationId,
          label: `Yeni mesaj — ${name}`,
          preview: data.content?.slice(0, 120) || 'Mesaj geldi',
          reason: 'message',
        })
      }

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
      if (!selectedIdRef.current && data.conversationId && !isInboxNarrowLayout()) {
        setSelectedId(data.conversationId)
      }
    },
    [mutateMessages, mutateConversations, conversations, triggerPersistentAlert]
  )

  useEffect(() => {
    if (!session?.user?.id || !websiteId) return
    const socket = retainSocket()
    if (!socket) return

    const auth = () => {
      void fetchAgentSocketAuth(socket.emit.bind(socket), { websiteIds: [websiteId] })
    }

    const onConversationNew = (data: { conversationId: string }) => {
      void mutateConversations()
      triggerPersistentAlert({
        id: data.conversationId,
        conversationId: data.conversationId,
        label: 'Yeni sohbet başladı',
        preview: 'Müşteri widget üzerinden yazdı',
        reason: 'conversation',
      })
      setSelectedId((cur) => {
        if (cur) return cur
        return isInboxNarrowLayout() ? null : data.conversationId
      })
    }
    const onVisitorOnline = (data: {
      visitorId: string
      name?: string | null
      email?: string | null
      currentTitle?: string | null
      currentPage?: string | null
    }) => {
      if (selectedIdRef.current) return
      const name = data.name?.trim() || data.email?.split('@')[0] || 'Ziyaretçi'
      triggerPersistentAlert({
        id: `visitor:${data.visitorId}`,
        label: `Ziyaretçi sitede — ${name}`,
        preview: data.currentTitle || data.currentPage || 'Canlı oturum',
        reason: 'visitor',
      })
    }
    const onConversationUpdated = () => {
      void mutateConversations()
    }

    socket.on('connect', auth)
    socket.on('agent:message', handleIncomingMessage)
    socket.on('agent:conversation:new', onConversationNew)
    socket.on('agent:conversation:updated', onConversationUpdated)
    socket.on('agent:visitor:online', onVisitorOnline)
    if (socket.connected) auth()

    return () => {
      socket.off('connect', auth)
      socket.off('agent:message', handleIncomingMessage)
      socket.off('agent:conversation:new', onConversationNew)
      socket.off('agent:conversation:updated', onConversationUpdated)
      socket.off('agent:visitor:online', onVisitorOnline)
      releaseSocket()
    }
  }, [session?.user?.id, websiteId, mutateConversations, handleIncomingMessage, triggerPersistentAlert])

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

  const handleMessageChange = (value: string) => {
    setMessageText(value)
    setShowCannedPicker(value.startsWith('/'))
  }

  const runCopilot = async (mode: string) => {
    if (!selectedId || aiSuggesting) return
    setAiSuggesting(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedId,
          mode,
          draft: messageText,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || i.aiSuggestFailed)
      if (data.suggestion) setMessageText(data.suggestion)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : i.aiSuggestFailed)
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleAiSuggest = async () => {
    if (!selectedId || aiSuggesting) return
    await runCopilot('suggest')
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

  const lastVisitorSentiment = messages.filter((m) => m.senderType === 'VISITOR').slice(-1)[0]?.sentiment

  const mappedMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderType: m.senderType,
        createdAt: m.createdAt,
        sentiment: m.sentiment,
        attachments: m.attachments?.map((a) => ({
          id: a.id,
          url: a.url,
          filename: a.filename,
          mimetype: a.mimetype,
          size: a.size,
        })),
      })),
    [messages]
  )

  if (loadError) {
    return (
      <div className="inbox-shell p-8 text-center space-y-4 h-full flex flex-col items-center justify-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-sm text-destructive font-medium max-w-md">{loadError}</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Marketing sitesi veya env ayarı eksik olabilir. Arka planda kurulum devam ediyor olabilir — birkaç saniye sonra tekrar deneyin.
        </p>
        <Button onClick={() => loadSetup()}>Yeniden dene</Button>
      </div>
    )
  }

  if (!marketingSite && !loadError) {
    return (
      <div className="inbox-shell flex flex-col items-center justify-center h-full gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <p className="text-sm text-muted-foreground">Gelen kutusu yükleniyor…</p>
      </div>
    )
  }

  if (!marketingSite) return null

  const mobileChatOpen = isNarrow && !!selectedId

  return (
    <div className="inbox-shell flex-1 min-h-0 h-full w-full max-w-full flex overflow-hidden">
      {/* Sidebar — müşteri paneli ile aynı */}
      <div
        className={`inbox-shell-list w-full lg:w-[340px] xl:w-[380px] border-r flex flex-col min-h-0 shrink-0 ${
          mobileChatOpen ? 'hidden lg:flex' : 'flex flex-1 lg:flex-none'
        }`}
      >
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Gelen Kutusu</h1>
              <ConnectionBadge connected={liveConnected} socketEnabled={isSocketEnabled()} />
              {inboxUnread > 0 && (
                <span className="text-xs font-medium text-primary tabular-nums">{inboxUnread}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <InboxBulkActionsBar
                selectionMode={selectionMode}
                selectedCount={selectedIds.size}
                totalVisible={filteredConversations.length}
                deleting={deleting}
                onToggleSelectionMode={() => {
                  setSelectionMode((v) => {
                    if (v) setSelectedIds(new Set())
                    return !v
                  })
                }}
                onSelectAll={() => setSelectedIds(new Set(filteredConversations.map((c) => c.id)))}
                onClearSelection={() => setSelectedIds(new Set())}
                onBulkDelete={() => void handleBulkDelete()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title={soundOn ? 'Ses açık' : 'Ses kapalı'}
                onClick={() => {
                  setSoundOn((v) => !v)
                  if (!soundOn) unlockInboxAudio()
                }}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {marketingSite.name && (
            <p className="text-xs text-muted-foreground truncate">{marketingSite.name}</p>
          )}

          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { key: 'all' as const, label: 'Tümü' },
                { key: 'OPEN' as const, label: 'Açık' },
                { key: 'PENDING' as const, label: 'Beklemede' },
                { key: 'RESOLVED' as const, label: 'Çözüldü' },
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
              placeholder="İsim, e-posta veya mesaj ara…"
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
          ) : error ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="link" size="sm" onClick={() => mutateConversations()}>
                Tekrar dene
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">Sohbet yok</h3>
              <p className="text-sm text-muted-foreground mt-1">Widget üzerinden gelen mesajlar burada görünür.</p>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={{
                  id: c.id,
                  status: c.status,
                  source: c.source,
                  visitorLang: c.visitorLang,
                  lastMessageAt: c.lastMessageAt,
                  lastMessagePreview: c.lastMessagePreview,
                  unreadCount: c.unreadCount,
                  visitorId: c.visitorId,
                  visitor: {
                    id: c.visitor.id,
                    name: c.visitor.name,
                    email: c.visitor.email,
                    avatarUrl: c.visitor.avatarUrl,
                  },
                }}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
                variant="admin"
                selectionMode={selectionMode}
                checked={selectedIds.has(c.id)}
                onToggleCheck={() => toggleConversationSelection(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={`inbox-shell-chat flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
          mobileChatOpen ? INBOX_CHAT_PANEL_MOBILE : 'hidden lg:flex'
        }`}
      >
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              {selectedId ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Sohbet yükleniyor…</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Sohbet seçin</h2>
                  <p className="text-sm text-muted-foreground mt-1">Soldan bir konuşma seçerek yanıt verin.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <ChatHeader
              conversation={selectedConversation}
              onBack={showInboxList}
              canTranslate
              autoTranslate={autoTranslate}
              onToggleTranslate={toggleAutoTranslate}
              detectedLang={normalizedVisitorLang}
              agentLang={agentLang}
              primaryColor={inboxPrimary}
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
              updating={updatingConversation || deleting}
              onDeleteConversation={() => void handleDeleteConversation()}
              showVisitorLinks
              visitorId={selectedConversation.visitorId || selectedConversation.visitor?.id}
            />

            <LanguageBar
              agentLang={agentLang}
              onAgentLangChange={setAgentLang}
              visitorLang={normalizedVisitorLang}
              autoTranslate={autoTranslate}
              canTranslate
            />

            {handoffSummary && (
              <div className="mx-4 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground whitespace-pre-wrap">
                <span className="font-semibold">{i.aiHandoffSummary}: </span>
                {handoffSummary}
              </div>
            )}

            <InboxMessageArea ref={messageScrollRef} onAreaScroll={onMessageScroll}>
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className={`h-12 ${i % 2 ? 'ml-auto w-2/3' : 'w-2/3'} rounded-2xl`} />
                  ))}
                </div>
              ) : mappedMessages.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">Henüz mesaj yok</p>
              ) : (
                <MessageThread
                  messages={mappedMessages}
                  autoTranslate={autoTranslate}
                  canTranslate
                  websiteId={websiteId}
                  agentLang={agentLang}
                  primaryColor={inboxPrimary}
                  onDeleteMessage={(messageId) => void handleDeleteMessage(messageId)}
                  deletingMessageId={deletingMessageId}
                />
              )}
              {lastVisitorSentiment === 'NEGATIVE' && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-destructive py-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {i.negativeSentiment}
                </div>
              )}
              {aiError && <p className="text-xs text-destructive text-center">{aiError}</p>}
            </InboxMessageArea>

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
              canUpload
              canCanned
              canAi
              aiEnabled={aiSuggestEnabled}
              onAiSuggest={handleAiSuggest}
              onAiCopilot={(mode) => void runCopilot(mode)}
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
              primaryColor={inboxPrimary}
              sendError={sendError}
              placeholder={
                translationPairActive && normalizedVisitorLang
                  ? `${languageLabel(agentLang)} yazın — ${languageLabel(normalizedVisitorLang)}'ye çevrilir`
                  : 'Yanıt yazın… (/ hazır cevap, AI öneri üstte)'
              }
            />
          </>
        )}
      </div>

      {selectedConversation && (
        <VisitorContextPanel
          conversation={selectedConversation}
          websitePublicId={websiteId}
          onVisitorUpdated={() => void mutateConversations()}
          onTagsUpdated={() => void mutateConversations()}
        />
      )}
    </div>
  )
}
