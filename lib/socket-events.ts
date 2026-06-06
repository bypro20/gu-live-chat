import { getIO } from './socket'

export function emitAgentMessage(params: {
  conversationId: string
  websiteId: string
  message: {
    id: string
    content: string
    type: string
    senderId: string
    senderName: string
    createdAt: Date | string
  }
}) {
  const io = getIO()
  if (!io) return

  const createdAt =
    typeof params.message.createdAt === 'string'
      ? params.message.createdAt
      : params.message.createdAt.toISOString()

  io.to(`conversation:${params.conversationId}`).emit('visitor:message', {
    id: params.message.id,
    content: params.message.content,
    type: params.message.type,
    senderType: 'AGENT',
    senderId: params.message.senderId,
    senderName: params.message.senderName,
    createdAt,
  })

  io.to(`conversation:${params.conversationId}`).emit('agent:message', {
    id: params.message.id,
    conversationId: params.conversationId,
    content: params.message.content,
    type: params.message.type,
    senderType: 'AGENT',
    senderId: params.message.senderId,
    senderName: params.message.senderName,
    createdAt,
  })

  io.to(`website:${params.websiteId}`).emit('agent:conversation:updated', {
    conversationId: params.conversationId,
    lastMessage: params.message.content.substring(0, 100),
  })
}

export function emitVisitorMessage(params: {
  conversationId: string
  websiteId: string
  message: {
    id: string
    content: string
    type: string
    visitorId: string
    createdAt: Date | string
  }
  isNewConversation?: boolean
}) {
  const io = getIO()
  if (!io) return

  const createdAt =
    typeof params.message.createdAt === 'string'
      ? params.message.createdAt
      : params.message.createdAt.toISOString()

  io.to(`conversation:${params.conversationId}`).emit('agent:message', {
    id: params.message.id,
    conversationId: params.conversationId,
    content: params.message.content,
    type: params.message.type,
    senderType: 'VISITOR',
    visitorId: params.message.visitorId,
    createdAt,
  })

  if (params.isNewConversation) {
    io.to(`website:${params.websiteId}`).emit('agent:conversation:new', {
      conversationId: params.conversationId,
      visitorId: params.message.visitorId,
      lastMessage: params.message.content.substring(0, 100),
    })
  } else {
    io.to(`website:${params.websiteId}`).emit('agent:conversation:updated', {
      conversationId: params.conversationId,
      lastMessage: params.message.content.substring(0, 100),
    })
  }
}
