import { prisma } from './db'
import type { TeamRole } from '@/app/generated/prisma/client'

const INVITE_TTL_DAYS = 7

export async function acceptTeamInvite(
  token: string,
  userId: string,
  userEmail: string
): Promise<{ websiteId: string; websitePublicId: string } | { error: string }> {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { website: { select: { id: true, websiteId: true, plan: true } } },
  })

  if (!invite || invite.acceptedAt) {
    return { error: 'Davet geçersiz veya süresi dolmuş' }
  }

  if (invite.expiresAt < new Date()) {
    return { error: 'Davet süresi dolmuş' }
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { error: 'Bu davet farklı bir e-posta adresi için gönderilmiş' }
  }

  const existing = await prisma.teamMember.findUnique({
    where: {
      userId_websiteId: { userId, websiteId: invite.websiteId },
    },
  })
  if (existing) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })
    return {
      websiteId: invite.website.id,
      websitePublicId: invite.website.websiteId,
    }
  }

  const memberCount = await prisma.teamMember.count({
    where: { websiteId: invite.websiteId },
  })
  const { PLAN_LIMITS } = await import('./constants')
  const limits = PLAN_LIMITS[invite.website.plan]
  if (memberCount >= limits.maxAgents) {
    return { error: 'Takım temsilci limiti dolu' }
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        userId,
        websiteId: invite.websiteId,
        role: invite.role,
        invitedBy: invite.invitedBy,
        invitedAt: invite.invitedAt,
        acceptedAt: new Date(),
      },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { activeWebsiteId: invite.website.websiteId },
    }),
  ])

  return {
    websiteId: invite.website.id,
    websitePublicId: invite.website.websiteId,
  }
}

export function teamInviteExpiry(): Date {
  const expires = new Date()
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS)
  return expires
}

export function buildTeamInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/register?invite=${token}`
}

export type { TeamRole }
