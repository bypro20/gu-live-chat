import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const ip = getClientIp(req)
  if (ip && (await isIpBanned(ip))) {
    return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
  }

  if (ip) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastIp: ip, lastSeenAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}
