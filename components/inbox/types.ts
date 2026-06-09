export type InboxAttachment = {
  id?: string
  url: string
  fileName?: string
  filename?: string
  mimeType?: string | null
  mimetype?: string
  fileSize?: number | null
  size?: number
}

export type InboxMessage = {
  id: string
  content: string
  type: string
  senderType: string
  createdAt: string
  sentiment?: string | null
  senderName?: string | null
  senderImage?: string | null
  attachments?: InboxAttachment[]
}

export type InboxConversation = {
  id: string
  status: string
  source?: string
  visitorLang?: string | null
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadCount: number
  visitorId?: string
  visitor: { id?: string; name: string | null; email: string | null; avatarUrl: string | null }
  assignedTo?: { name: string | null; image: string | null } | null
  _count?: { messages: number }
}
