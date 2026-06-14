type SocketEmit = (event: string, payload: Record<string, unknown>) => void

type AgentSocketAuthOptions = {
  websiteIds: string[]
  scope?: 'platform'
}

/** Sunucudan doğrulanmış agent kimliği alıp socket'e gönderir. */
export async function fetchAgentSocketAuth(
  emit: SocketEmit,
  options: AgentSocketAuthOptions
): Promise<void> {
  try {
    const res = await fetch('/api/socket/agent-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        websiteIds: options.websiteIds,
        scope: options.scope,
      }),
    })
    if (!res.ok) return
    const data = (await res.json()) as {
      userId?: string
      websiteIds?: string[]
      scope?: string
    }
    if (!data.userId || !Array.isArray(data.websiteIds)) return
    emit('agent:auth', {
      userId: data.userId,
      websiteIds: data.websiteIds,
      ...(data.scope ? { scope: data.scope } : {}),
    })
  } catch {
    // Socket yeniden bağlanınca tekrar denenecek
  }
}
