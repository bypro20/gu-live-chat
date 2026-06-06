import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { banIpAddress, unbanIpAddress } from '@/lib/ip-ban'
import { z } from 'zod'

const banSchema = z.object({
  ipAddress: z.string().min(7, 'Geçerli bir IP adresi girin'),
  reason: z.string().optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 }) }
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  })
  if (!user || user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 }) }
  }
  return { user }
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const bans = await prisma.ipBan.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bans)
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  try {
    const body = await req.json()
    const validated = banSchema.parse(body)
    const ban = await banIpAddress(validated.ipAddress, validated.reason, check.user.id)
    return NextResponse.json(ban, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('IP ban error:', error)
    return NextResponse.json({ error: 'IP engellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const { searchParams } = new URL(req.url)
  const ipAddress = searchParams.get('ipAddress')
  if (!ipAddress) {
    return NextResponse.json({ error: 'IP adresi gerekli' }, { status: 400 })
  }

  await unbanIpAddress(ipAddress)
  return NextResponse.json({ message: 'IP engeli kaldırıldı' })
}
