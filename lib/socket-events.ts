import { getIO } from './socket'
import { bridgeSocketEmit } from './socket-bridge'
import {
  emitAgentMessageOnIO,
  emitBotMessageOnIO,
  emitBotTypingOnIO,
  emitVisitorMessageOnIO,
  emitVisitorMessagesReadOnIO,
  type AgentMessageEmit,
  type BotMessageEmit,
  type BotTypingEmit,
  type VisitorMessageEmit,
  type VisitorMessagesReadEmit,
  type VisitorGeoEmit,
} from './socket-emit-core'

export function emitAgentMessage(params: AgentMessageEmit) {
  const io = getIO()
  if (io) {
    emitAgentMessageOnIO(io, params)
    return
  }
  void bridgeSocketEmit({ kind: 'agent', params })
}

export function emitVisitorMessage(params: VisitorMessageEmit) {
  const io = getIO()
  if (io) {
    emitVisitorMessageOnIO(io, params)
    return
  }
  void bridgeSocketEmit({ kind: 'visitor', params })
}

export function emitBotMessage(params: BotMessageEmit) {
  const io = getIO()
  if (io) {
    emitBotMessageOnIO(io, params)
    return
  }
  void bridgeSocketEmit({ kind: 'bot', params })
}

export function emitBotTyping(params: BotTypingEmit & { start: boolean }) {
  const io = getIO()
  if (io) {
    emitBotTypingOnIO(io, params)
    return
  }
  void bridgeSocketEmit({ kind: 'bot-typing', params })
}

export type { VisitorGeoEmit } from './socket-emit-core'

export function emitVisitorMessagesRead(params: VisitorMessagesReadEmit) {
  const io = getIO()
  if (io) {
    emitVisitorMessagesReadOnIO(io, params)
    return
  }
  void bridgeSocketEmit({ kind: 'visitor-read', params })
}

export function emitVisitorGeoUpdate(params: VisitorGeoEmit) {
  const io = getIO()
  const payload = { ...params, timestamp: new Date().toISOString() }
  if (io) {
    io.to(`website:${params.websiteId}`).emit('agent:visitor:geo', payload)
    return
  }
  void bridgeSocketEmit({ kind: 'visitor-geo', params })
}
