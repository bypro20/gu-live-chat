/**
 * Verifies admin@guchat.org in DATABASE_URL: role, ban status, password match.
 * Usage: npx tsx scripts/verify-admin.ts  (reads .env + .env.local)
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const { prisma } = await import('../lib/db')

const ADMIN_EMAIL = 'admin@guchat.org'

async function main() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.error('ADMIN_PASSWORD env var required')
    process.exit(1)
  }

  const dbUrl = process.env.DATABASE_URL ?? '(not set)'
  const isTurso = dbUrl.startsWith('libsql://')
  console.log(`DATABASE: ${isTurso ? dbUrl : dbUrl.replace(/\/[^/]+$/, '/***')}`)

  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!user) {
    console.error(`FAIL: ${ADMIN_EMAIL} not found`)
    process.exit(1)
  }

  console.log(`email=${user.email} role=${user.role} banned=${user.isBanned} hasPassword=${Boolean(user.passwordHash)}`)

  if (user.role !== 'ADMIN') {
    console.error(`FAIL: role is "${user.role}", expected ADMIN`)
    process.exit(1)
  }

  if (!user.passwordHash) {
    console.error('FAIL: no password hash')
    process.exit(1)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    console.error('FAIL: password does not match')
    process.exit(1)
  }

  console.log('OK: admin verified')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
