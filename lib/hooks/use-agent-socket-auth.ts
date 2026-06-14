'use client'

import { fetchAgentSocketToken } from '@/lib/socket-agent-auth'

type EmitFn = (event: string, data: unknown) => void

export async function fetchAgentSocketAuth(
  emit: EmitFn,
  options: { websiteIds: string[]; scope?: 'platform' }
): Promise<boolean> {
  const token = await fetchAgentSocketToken(options.scope)
  if (!token) return false
  emit('agent:auth', {
    token,
    websiteIds: options.websiteIds,
    scope: options.scope,
  })
  return true
}

export { emitAgentSocketAuth } from '@/lib/socket-agent-auth'
