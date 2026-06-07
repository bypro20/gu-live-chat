import type { Server as SocketIOServer } from 'socket.io'

export type AgentMessageEmit = {
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
}

export type VisitorMessageEmit = {
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
}

export type BotMessageEmit = {
  conversationId: string
  websiteId: string
  message: {
    id: string
    content: string
    senderName: string
    createdAt: Date | string
  }
}

function toIso(createdAt: Date | string): string {
  return typeof createdAt === 'string' ? createdAt : createdAt.toISOString()
}

export function emitAgentMessageOnIO(io: SocketIOServer, params: AgentMessageEmit) {
  const createdAt = toIso(params.message.createdAt)

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

export function emitVisitorMessageOnIO(io: SocketIOServer, params: VisitorMessageEmit) {
  const createdAt = toIso(params.message.createdAt)

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
    io.to(`website:${params.websiteId}`).emit('agent:message', {
      id: params.message.id,
      conversationId: params.conversationId,
      content: params.message.content,
      type: params.message.type,
      senderType: 'VISITOR',
      visitorId: params.message.visitorId,
      createdAt,
    })
  }
}

export function emitBotMessageOnIO(io: SocketIOServer, params: BotMessageEmit) {
  const createdAt = toIso(params.message.createdAt)

  io.to(`conversation:${params.conversationId}`).emit('visitor:message', {
    id: params.message.id,
    content: params.message.content,
    type: 'TEXT',
    senderType: 'BOT',
    senderName: params.message.senderName,
    createdAt,
  })

  io.to(`website:${params.websiteId}`).emit('agent:conversation:updated', {
    conversationId: params.conversationId,
    lastMessage: params.message.content.substring(0, 100),
  })
}

export type RemoteSocketEmit =
  | { kind: 'agent'; params: AgentMessageEmit }
  | { kind: 'visitor'; params: VisitorMessageEmit }
  | { kind: 'bot'; params: BotMessageEmit }

export function applyRemoteSocketEmit(io: SocketIOServer, body: RemoteSocketEmit) {
  if (body.kind === 'agent') emitAgentMessageOnIO(io, body.params)
  else if (body.kind === 'visitor') emitVisitorMessageOnIO(io, body.params)
  else emitBotMessageOnIO(io, body.params)
}
