'use client'

import { connectSocket, getSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

type AgentSocketScope = 'platform' | undefined

export async function fetchAgentSocketToken(scope?: AgentSocketScope): Promise<string | null> {
  try {
    const res = await fetch('/api/socket/agent-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(scope ? { scope } : {}),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { token?: string }
    return data.token ?? null
  } catch {
    return null
  }
}

function waitForSocketConnect(socket: Socket, timeoutMs = 12000): Promise<boolean> {
  if (socket.connected) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off('connect', onConnect)
      resolve(false)
    }, timeoutMs)
    const onConnect = () => {
      clearTimeout(timer)
      socket.off('connect', onConnect)
      resolve(true)
    }
    socket.on('connect', onConnect)
    socket.connect()
  })
}

function waitForAgentAuthOk(socket: Socket, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off('agent:auth:ok', onOk)
      resolve(false)
    }, timeoutMs)
    const onOk = () => {
      clearTimeout(timer)
      socket.off('agent:auth:ok', onOk)
      resolve(true)
    }
    socket.on('agent:auth:ok', onOk)
  })
}

export async function emitAgentSocketAuth(
  emit: (event: string, data: unknown) => void,
  websiteIds: string[],
  scope?: AgentSocketScope
): Promise<boolean> {
  const token = await fetchAgentSocketToken(scope)
  if (!token) return false
  emit('agent:auth', { token, websiteIds, scope })
  return true
}

/** Socket bağlantısı + agent:auth:ok gelene kadar bekler (ekran izleme öncesi zorunlu). */
export async function waitForAgentSocketAuth(
  websiteIds: string[],
  scope?: AgentSocketScope
): Promise<boolean> {
  const socket = getSocket() || connectSocket()
  if (!socket) return false

  const connected = await waitForSocketConnect(socket)
  if (!connected) return false

  const authOkPromise = waitForAgentAuthOk(socket)
  const token = await fetchAgentSocketToken(scope)
  if (!token) return false

  socket.emit('agent:auth', { token, websiteIds, scope })
  return authOkPromise
}
