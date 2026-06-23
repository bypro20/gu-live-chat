'use client'

import { connectSocket, getSocket } from '@/lib/socket-client'

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

/** Token gönder + agent:auth:ok bekle (Railway uzaktan doğrulama sürebilir). */
export async function ensureAgentSocketAuth(
  emit: (event: string, data: unknown) => void,
  websiteIds: string[],
  scope?: AgentSocketScope
): Promise<boolean> {
  const socket = getSocket() || connectSocket()
  if (!socket) return false

  if (!socket.connected) {
    const connected = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 12000)
      const onConnect = () => {
        clearTimeout(timer)
        socket.off('connect', onConnect)
        resolve(true)
      }
      socket.on('connect', onConnect)
      socket.connect()
    })
    if (!connected) return false
  }

  const token = await fetchAgentSocketToken(scope)
  if (!token) return false

  return new Promise((resolve) => {
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      cleanup()
      resolve(ok)
    }
    const timer = setTimeout(() => finish(true), 6000)
    const legacy = setTimeout(() => finish(socket.connected), 2000)
    const onOk = () => {
      clearTimeout(legacy)
      finish(true)
    }
    const onFail = () => finish(false)
    const cleanup = () => {
      clearTimeout(timer)
      clearTimeout(legacy)
      socket.off('agent:auth:ok', onOk)
      socket.off('agent:auth:failed', onFail)
    }
    socket.on('agent:auth:ok', onOk)
    socket.on('agent:auth:failed', onFail)
    emit('agent:auth', { token, websiteIds, scope })
  })
}
