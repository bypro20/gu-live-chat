import { prisma } from '../db'

/** Builds a short visitor profile string for AI system prompts. */
export async function loadVisitorContext(
  visitorId: string,
  conversationId?: string
): Promise<string> {
  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      select: {
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        browser: true,
        device: true,
        notes: true,
      },
    })
    if (!visitor) return ''

    const parts: string[] = []
    if (visitor.name) parts.push(`Ad: ${visitor.name}`)
    if (visitor.email) parts.push(`E-posta: ${visitor.email}`)
    if (visitor.phone) parts.push(`Telefon: ${visitor.phone}`)
    if (visitor.city || visitor.country) {
      parts.push(`Konum: ${[visitor.city, visitor.country].filter(Boolean).join(', ')}`)
    }
    if (visitor.browser || visitor.device) {
      parts.push(`Cihaz: ${[visitor.browser, visitor.device].filter(Boolean).join(' / ')}`)
    }
    if (visitor.notes?.trim()) parts.push(`Notlar: ${visitor.notes.trim().slice(0, 200)}`)

    let session = await prisma.visitorSession.findFirst({
      where: { visitorId },
      orderBy: { startedAt: 'desc' },
      select: { currentPage: true, currentTitle: true, landingPage: true },
    })

    if (session?.currentPage) {
      parts.push(`Şu an baktığı sayfa: ${session.currentTitle || session.currentPage}`)
    } else if (session?.landingPage) {
      parts.push(`Giriş sayfası: ${session.landingPage}`)
    }

    return parts.length > 0 ? parts.join(' · ') : ''
  } catch {
    return ''
  }
}
