import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isPlatformAdminRole } from '@/lib/platform-admin-shared'

export { isPlatformAdminRole, ADMIN_UNLIMITED_LIMITS } from '@/lib/platform-admin-shared'

export async function sessionIsPlatformAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return isPlatformAdminRole(user?.role)
}
