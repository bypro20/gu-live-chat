import bcrypt from 'bcryptjs'
import { prisma } from '../lib/db'
import { ensureMarketingWebsite } from '../lib/marketing-website'

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gerekli')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Guchat Platform Admin',
      passwordHash,
      role: 'ADMIN',
    },
    update: {
      passwordHash,
      role: 'ADMIN',
    },
  })

  const marketingWebsiteId = await ensureMarketingWebsite(user.id)
  console.log(`✅ Admin kullanıcı hazır: ${user.email} (role: ${user.role})`)
  console.log(`✅ Marketing website: ${marketingWebsiteId} (guchat.org widget → bu site inbox'a düşer)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
