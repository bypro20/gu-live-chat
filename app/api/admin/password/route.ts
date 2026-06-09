import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { adminChangePasswordSchema } from '@/lib/validators/admin-account'

export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const parsed = adminChangePasswordSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first?.message || 'Geçersiz veri', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: check.user.id },
      select: { id: true, email: true, passwordHash: true, isBanned: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }
    if (user.isBanned) {
      return NextResponse.json({ error: 'Hesabınız engellenmiş' }, { status: 403 })
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            'Bu hesapta şifre tanımlı değil (sosyal giriş). Şifre atamak için destek ile iletişime geçin.',
        },
        { status: 400 }
      )
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({
      message: 'Şifreniz başarıyla güncellendi',
      email: user.email,
    })
  } catch (error) {
    console.error('[Admin Password] PATCH error:', error)
    return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 })
  }
}
