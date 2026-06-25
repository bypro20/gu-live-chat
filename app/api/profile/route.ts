import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  image: z.union([z.string().url(), z.null()]).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = updateProfileSchema.parse(body)

    if (validated.name === undefined && validated.image === undefined) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.image !== undefined ? { image: validated.image } : {}),
      },
      select: { id: true, name: true, email: true, image: true },
    })

    return NextResponse.json(user)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz profil verisi', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 500 })
  }
}
