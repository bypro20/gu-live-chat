import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export type AdminSession = {
  id: string
  role: 'ADMIN'
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 }) }
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true },
  })

  // Session token can briefly carry a stale user id after credential sign-in.
  if ((!user || user.role !== 'ADMIN') && session.user.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: session.user.email.trim().toLowerCase() },
      select: { id: true, role: true, email: true },
    })
    if (byEmail?.role === 'ADMIN') {
      user = byEmail
    }
  }

  if (!user || user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 }) }
  }

  return { user: user as AdminSession & { email: string } }
}
