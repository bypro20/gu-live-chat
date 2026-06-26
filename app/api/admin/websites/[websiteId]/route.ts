import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateWebsiteSchema } from '@/lib/validators/website'
import { loadWebsiteAgentFields, saveWebsiteAgentFields } from '@/lib/website-agent-fields'

const widgetSelect = {
  id: true,
  websiteId: true,
  name: true,
  domain: true,
  plan: true,
  primaryColor: true,
  position: true,
  welcomeMessage: true,
  offlineMessage: true,
  avatarUrl: true,
  showPreChatForm: true,
  requireName: false,
  requireEmail: false,
} as const

async function requirePlatformAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 }) }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 }) }
  }

  return { session }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const check = await requirePlatformAdmin()
    if ('error' in check) return check.error

    const { websiteId } = await params

    const website = await prisma.website.findFirst({
      where: { OR: [{ id: websiteId }, { websiteId }] },
      select: widgetSelect,
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const agentFields = await loadWebsiteAgentFields(website.id)
    return NextResponse.json({ ...website, ...agentFields })
  } catch (error) {
    console.error('Admin get website error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const check = await requirePlatformAdmin()
    if ('error' in check) return check.error

    const { websiteId } = await params
    const body = await req.json()

    const target = await prisma.website.findFirst({
      where: { OR: [{ id: websiteId }, { websiteId }] },
      select: { id: true },
    })

    if (!target) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    if (body.plan !== undefined) {
      if (!['FREE', 'STARTER', 'PRO', 'BUSINESS'].includes(body.plan)) {
        return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
      }
    }

    const widgetFields = updateWebsiteSchema.safeParse(body)
    const data: Record<string, unknown> = {}
    let agentPatch: { agentDisplayName?: string | null; agentTitle?: string | null } = {}

    if (body.plan !== undefined) data.plan = body.plan
    if (widgetFields.success) {
      const { agentDisplayName, agentTitle, ...rest } = widgetFields.data
      Object.assign(data, rest)
      if (agentDisplayName !== undefined) agentPatch.agentDisplayName = agentDisplayName
      if (agentTitle !== undefined) agentPatch.agentTitle = agentTitle
    } else if (body.plan === undefined) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: widgetFields.error.issues },
        { status: 400 }
      )
    }

    const updated = await prisma.website.update({
      where: { id: target.id },
      data,
      select: widgetSelect,
    })

    await saveWebsiteAgentFields(target.id, agentPatch)
    const agentFields = await loadWebsiteAgentFields(target.id)

    return NextResponse.json({ ...updated, ...agentFields })
  } catch (error) {
    console.error('Admin update website error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
