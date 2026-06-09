import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@/app/generated/prisma/client'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { adminChangeEmailSchema } from '@/lib/validators/admin-account'

export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const parsed = adminChangeEmailSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first?.message || 'Geçersiz veri', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { newEmail, currentPassword } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: check.user.id },
      select: { id: true, email: true, passwordHash: true, isBanned: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }
    if (user.isBanned) {
      return NextResponse.json({ error: 'Hesabınız engellenmiş' }, { status: 403 })
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Sosyal giriş hesabında e-posta buradan değiştirilemez.' },
        { status: 400 }
      )
    }

    if (newEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Yeni e-posta mevcut adresinizle aynı' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 })
    }

    const taken = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    })
    if (taken && taken.id !== user.id) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
      select: { id: true, email: true, role: true },
    })

    return NextResponse.json({
      message: 'E-posta adresiniz güncellendi. Yeniden giriş yapmanız gerekiyor.',
      email: updated.email,
      reauthRequired: true,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 409 })
    }
    console.error('[Admin Email] PATCH error:', error)
    return NextResponse.json({ error: 'E-posta güncellenemedi' }, { status: 500 })
  }
}
