import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const user = await prisma.user.findUnique({
      where: { id: check.user.id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Admin me error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}