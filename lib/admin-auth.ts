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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 }) }
  }

  return { user: user as AdminSession & { email: string } }
}
