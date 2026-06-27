import type { NextRequest } from 'next/server'

export function getClientIp(req: Request | NextRequest): string | null {
  // Platform Vercel — yalnızca Vercel edge'in eklediği, istemcinin
  // override edemediği başlıklara güven. `cf-connecting-ip` ve
  // `x-forwarded-for`'un en soldaki değeri istemci tarafından spoof
  // edilebilir; rate-limit/IP-ban bypass'ını önlemek için bunları
  // güvenilir başlıklardan SONRA, yalnızca fallback olarak kullan.
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp?.trim()) {
    const ip = vercelIp.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp?.trim()) return realIp.trim()

  // Fallback (yerel geliştirme / Vercel dışı proxy). Üretimde Vercel
  // yukarıdaki başlıkları her zaman set ettiğinden buraya düşülmez.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp?.trim()) return cfIp.trim()
  return null
}
