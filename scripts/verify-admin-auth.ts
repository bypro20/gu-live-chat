/**
 * Verifies admin@guchat.org exists in DB with ADMIN role and password matches.
 * Usage: ADMIN_PASSWORD='...' npx tsx scripts/verify-admin-auth.ts
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/db'

const ADMIN_EMAIL = 'admin@guchat.org'

async function main() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.error('ADMIN_PASSWORD env var required')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!user) {
    console.error(`FAIL: ${ADMIN_EMAIL} not found in database`)
    process.exit(1)
  }

  console.log('User found:', {
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    hasPasswordHash: Boolean(user.passwordHash),
  })

  if (user.role !== 'ADMIN') {
    console.error(`FAIL: role is "${user.role}", expected "ADMIN"`)
    process.exit(1)
  }

  if (!user.passwordHash) {
    console.error('FAIL: no password hash stored')
    process.exit(1)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    console.error('FAIL: password does not match stored hash')
    process.exit(1)
  }

  console.log('OK: admin user verified (role=ADMIN, password matches)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
