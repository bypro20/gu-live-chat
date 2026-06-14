const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i

/** Allow only https URLs for user-supplied links (attachments, avatars). */
export function assertSafeHttpsUrl(url: string, label = 'URL'): string | null {
  const trimmed = url.trim()
  if (!trimmed || trimmed.length > 2000) return null

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null
  if (BLOCKED_PROTOCOLS.test(trimmed)) return null

  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return null
  }

  return parsed.toString()
}
