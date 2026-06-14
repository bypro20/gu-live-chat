import { config } from 'dotenv'
import { resolve } from 'path'
import { prisma } from '../lib/db'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const EMAIL = 'admin@gulivechat.com'

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true, role: true, isBanned: true, passwordHash: true },
  })
  console.log('admin user:', user ? { ...user, passwordHash: Boolean(user.passwordHash) } : null)

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, role: true },
  })
  console.log('all ADMIN users:', admins)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
