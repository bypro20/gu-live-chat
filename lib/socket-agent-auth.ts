'use client'

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
