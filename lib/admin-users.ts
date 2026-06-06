type RawUser = {
  id: string
  email: string
  name: string | null
  role: string
  isBanned: boolean
  isMuted: boolean
  bannedIp: string | null
  banReason: string | null
  bannedAt: Date | null
  mutedUntil: Date | null
  lastSeenAt: Date | null
  lastIp: string | null
  createdAt: Date
  _count?: {
    ownedWebsites: number
    assignedConversations?: number
  }
  ownedWebsites?: Array<{ id: string; name: string; domain: string }>
}

export function mapAdminUser(user: RawUser) {
  const now = new Date()
  const isMuted = user.isMuted && user.mutedUntil && new Date(user.mutedUntil) > now

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.isBanned ? 'BANNED' : isMuted ? 'MUTED' : 'ACTIVE',
    isBanned: user.isBanned,
    isMuted: user.isMuted,
    bannedIp: user.bannedIp,
    banReason: user.banReason,
    bannedAt: user.bannedAt,
    mutedUntil: user.mutedUntil,
    lastSeen: user.lastSeenAt,
    lastIp: user.lastIp,
    createdAt: user.createdAt,
    _count: user._count,
    ownedWebsites: user.ownedWebsites,
  }
}
