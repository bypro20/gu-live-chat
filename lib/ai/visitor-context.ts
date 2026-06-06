import { prisma } from '../db'

/** Builds a short visitor profile string for AI system prompts. */
export async function loadVisitorContext(visitorId: string): Promise<string> {
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

    return parts.length > 0 ? parts.join(' · ') : ''
  } catch {
    return ''
  }
}
