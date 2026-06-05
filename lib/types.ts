export interface SocketEvents {
  // Visitor -> Server
  'visitor:message': (data: {
    conversationId: string
    content: string
    type: string
    tempId: string
  }) => void
  'visitor:typing': (data: { conversationId: string }) => void
  'visitor:typing:stop': (data: { conversationId: string }) => void
  'visitor:read': (data: { conversationId: string; messageIds: string[] }) => void
  'visitor:pageview': (data: { url: string; title: string; referrer?: string }) => void

  // Agent -> Server
  'agent:message': (data: {
    conversationId: string
    content: string
    type: string
  }) => void
  'agent:typing': (data: { conversationId: string }) => void
  'agent:typing:stop': (data: { conversationId: string }) => void
  'agent:read': (data: { conversationId: string; messageIds: string[] }) => void
  'agent:join:conversation': (data: { conversationId: string }) => void
  'agent:leave:conversation': (data: { conversationId: string }) => void
}

export interface VisitorInitResponse {
  visitorToken: string
  visitorId: string
  sessionId: string
  conversationId?: string
  websiteConfig: {
    primaryColor: string
    position: string
    welcomeMessage: string
    offlineMessage: string
    avatarUrl: string | null
    agentsOnline: number
  }
}

export interface ConversationWithMessages {
  id: string
  status: string
  visitor: {
    id: string
    name: string | null
    email: string | null
    avatarUrl: string | null
  }
  assignedTo: {
    id: string
    name: string | null
    image: string | null
  } | null
  lastMessage: {
    content: string
    createdAt: string
    senderType: string
  } | null
  unreadCount: number
  tags: { id: string; name: string; color: string }[]
  createdAt: string
  updatedAt: string
}