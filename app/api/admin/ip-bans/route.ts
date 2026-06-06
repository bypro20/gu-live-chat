import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { banIpAddress, unbanIpAddress } from '@/lib/ip-ban'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const banSchema = z.object({
  ipAddress: z.string().min(7, 'Geçerli bir IP adresi girin'),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

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
    const expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null
    const ban = await banIpAddress(
      validated.ipAddress.trim(),
      validated.reason,
      check.user.id,
      expiresAt
    )
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
