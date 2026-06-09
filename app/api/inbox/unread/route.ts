import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/** Tenant gelen kutusu okunmamış sayısı (sidebar badge). */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websitePublicId = searchParams.get('websiteId')

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { websiteId: true },
  })
  let websiteIds = memberships.map((m) => m.websiteId)

  if (websitePublicId) {
    const website = await prisma.website.findUnique({
      where: { websiteId: websitePublicId },
      select: { id: true },
    })
    if (!website || !websiteIds.includes(website.id)) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }
    websiteIds = [website.id]
  }

  if (websiteIds.length === 0) {
    return NextResponse.json({ unreadCount: 0 })
  }

  const rows = await prisma.conversation.aggregate({
    where: { websiteId: { in: websiteIds } },
    _sum: { unreadCount: true },
  })

  return NextResponse.json({ unreadCount: rows._sum.unreadCount ?? 0 })
}
