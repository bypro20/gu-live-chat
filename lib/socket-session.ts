import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/db'

export type VerifiedSocketSession = {
  userId: string
  role?: string
  email?: string
}

/** Socket.io el sıkışmasında NextAuth oturum çerezini doğrula — client userId'ye güvenme. */
export async function verifyAgentSocketSession(
  cookieHeader: string | undefined
): Promise<VerifiedSocketSession | null> {
  if (!cookieHeader?.trim()) return null

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[Socket] AUTH_SECRET missing — agent auth disabled')
    return null
  }

  let token: Awaited<ReturnType<typeof getToken>>
  try {
    token = await getToken({
      req: { headers: { cookie: cookieHeader } },
      secret,
      secureCookie: process.env.NODE_ENV === 'production',
    })
  } catch (err) {
    console.error('[Socket] session token decode failed:', err)
    return null
  }

  if (!token?.id) return null

  const userId = String(token.id)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, isBanned: true },
  })

  if (!user || user.isBanned) return null

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
  }
}
