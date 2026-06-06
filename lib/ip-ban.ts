import { prisma } from './db'

export async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip) return false

  const ipBan = await prisma.ipBan.findUnique({
    where: { ipAddress: ip },
  })

  if (ipBan) {
    if (ipBan.expiresAt && ipBan.expiresAt < new Date()) {
      await prisma.ipBan.delete({ where: { id: ipBan.id } }).catch(() => {})
      return false
    }
    return true
  }

  const userWithBannedIp = await prisma.user.findFirst({
    where: { bannedIp: ip, isBanned: true },
    select: { id: true },
  })

  return !!userWithBannedIp
}

export async function banIpAddress(
  ip: string,
  reason?: string,
  bannedBy?: string,
  expiresAt?: Date | null
) {
  return prisma.ipBan.upsert({
    where: { ipAddress: ip },
    create: {
      ipAddress: ip,
      reason: reason || null,
      bannedBy: bannedBy || null,
      expiresAt: expiresAt || null,
    },
    update: {
      reason: reason || null,
      bannedBy: bannedBy || null,
      expiresAt: expiresAt || null,
    },
  })
}

export async function unbanIpAddress(ip: string) {
  await prisma.ipBan.deleteMany({ where: { ipAddress: ip } })
  await prisma.user.updateMany({
    where: { bannedIp: ip },
    data: { bannedIp: null },
  })
}
