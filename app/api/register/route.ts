import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validators/auth'
import { generateWebsiteId } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12)

    // Create user + website in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          passwordHash,
        },
      })

      const website = await tx.website.create({
        data: {
          name: validated.websiteName,
          domain: validated.websiteDomain,
          websiteId: generateWebsiteId(),
          ownerId: user.id,
        },
      })

      // Auto-create team member as OWNER
      await tx.teamMember.create({
        data: {
          userId: user.id,
          websiteId: website.id,
          role: 'OWNER',
          acceptedAt: new Date(),
        },
      })

      // Set activeWebsiteId so user lands on their website
      await tx.user.update({
        where: { id: user.id },
        data: { activeWebsiteId: website.websiteId },
      })

      return { user, website }
    })

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      website: {
        id: result.website.id,
        websiteId: result.website.websiteId,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}