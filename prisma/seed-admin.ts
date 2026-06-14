import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'
import { prisma } from '../lib/db'
import { ensureMarketingWebsite } from '../lib/marketing-website'
import { ADMIN_USER_DISPLAY_NAME } from '../lib/site-config'
import { syncProductionSchema } from '../lib/db-schema-sync'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gerekli')
    process.exit(1)
  }

  await syncProductionSchema()

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: ADMIN_USER_DISPLAY_NAME,
      passwordHash,
      role: 'ADMIN',
    },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: ADMIN_USER_DISPLAY_NAME,
    },
  })

  const marketingWebsiteId = await ensureMarketingWebsite(user.id)
  console.log(`✅ Admin kullanıcı hazır: ${user.email} (role: ${user.role})`)
  console.log(`✅ Marketing website: ${marketingWebsiteId} (gulivechat.com widget → bu site inbox'a düşer)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
