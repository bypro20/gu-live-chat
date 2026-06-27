const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i

/**
 * SSRF koruması: hostname literal bir private/loopback/link-local/metadata
 * IP veya yerel ad ise true döner. (DNS-rebinding'e karşı tam koruma için
 * sunucu fetch katmanında çözümlenmiş IP de doğrulanmalı.)
 */
export function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true
  }

  // IPv4 literal
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const a = Number(v4[1])
    const b = Number(v4[2])
    if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return true
    if (a === 0) return true // 0.0.0.0/8
    if (a === 10) return true // 10/8 private
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local + cloud metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12 private
    if (a === 192 && b === 168) return true // 192.168/16 private
    if (a === 100 && b >= 64 && b <= 127) return true // 100.64/10 CGNAT
    return false
  }

  // IPv6 literal
  if (host.includes(':')) {
    if (host === '::1' || host === '::') return true // loopback / unspecified
    if (host.startsWith('fe80')) return true // link-local
    if (host.startsWith('fc') || host.startsWith('fd')) return true // unique local
    // IPv4-mapped IPv6 (::ffff:169.254.169.254 vb.)
    const mapped = host.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (mapped) return isPrivateOrLocalHost(mapped[1])
    return false
  }

  return false
}

/** Allow only https URLs for user-supplied links (attachments, avatars). */
export function assertSafeHttpsUrl(url: string): string | null {
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

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return null
  }

  return parsed.toString()
}
