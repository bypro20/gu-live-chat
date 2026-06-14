import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createAgentSocketToken } from '@/lib/secure-tokens'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const limited = rateLimitByIp(req, 'socket-agent-token', 30, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  let scope: 'platform' | 'tenant' | undefined
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.scope === 'platform') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
      }
      scope = 'platform'
    }
  } catch {
    /* tenant scope default */
  }

  const token = createAgentSocketToken(session.user.id, scope)
  return NextResponse.json({ token, expiresIn: 300 })
}
