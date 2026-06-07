import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json().catch(() => ({}))
    if (body.confirm !== 'SIL') {
      return NextResponse.json({ error: 'Onay gerekli (SIL)' }, { status: 400 })
    }

    const deleted = await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({})
      const result = await tx.conversation.deleteMany({})
      return result.count
    })

    return NextResponse.json({ deletedConversations: deleted })
  } catch (error) {
    console.error('[Admin clear-conversations] error:', error)
    return NextResponse.json({ error: 'Sohbetler silinemedi' }, { status: 500 })
  }
}
