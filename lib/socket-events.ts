import { getIO } from './socket'
import { bridgeSocketEmit } from './socket-bridge'
import {
  emitAgentMessageOnIO,
  emitBotMessageOnIO,
  emitVisitorMessageOnIO,
  type AgentMessageEmit,
  type BotMessageEmit,
  type VisitorMessageEmit,
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
