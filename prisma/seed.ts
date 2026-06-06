import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('demo123', 12)

  const user = await prisma.user.create({
    data: {
      email: 'demo@gulive.com',
      name: 'Demo Kullanıcı',
      passwordHash,
    },
  })
  console.log(`✅ User: ${user.email}`)

  const website = await prisma.website.create({
    data: {
      name: 'Demo Sitesi',
      domain: 'demo.gulive.com',
      websiteId: 'demo-website-id-2024',
      ownerId: user.id,
      primaryColor: '#1972F5',
      welcomeMessage: 'Merhaba! Size nasıl yardımcı olabiliriz?',
      offlineMessage: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
      plan: 'FREE',
    },
  })
  console.log(`✅ Website: ${website.domain}`)

  await prisma.teamMember.create({
    data: { userId: user.id, websiteId: website.id, role: 'OWNER', acceptedAt: new Date().toISOString() },
  })

  await prisma.tag.createMany({
    data: [
      { name: 'Hata', color: '#EF4444', websiteId: website.id },
      { name: 'Özellik', color: '#3B82F6', websiteId: website.id },
      { name: 'Destek', color: '#10B981', websiteId: website.id },
    ],
  })

  const visitor = await prisma.visitor.create({
    data: {
      websiteId: website.id,
      fingerprint: 'demo-fp-001',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@ornek.com',
      country: 'Türkiye',
      city: 'İstanbul',
    },
  })

  const conversation = await prisma.conversation.create({
    data: {
      websiteId: website.id,
      visitorId: visitor.id,
      status: 'OPEN',
      source: 'WIDGET',
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: 'Merhaba, ürün iadesi yapmak istiyorum.',
    },
  })

  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, content: 'Merhaba, ürün iadesi yapmak istiyorum.', type: 'TEXT', senderType: 'VISITOR', status: 'READ' },
      { conversationId: conversation.id, content: 'Merhaba! Size yardımcı olayım. Sipariş numaranızı paylaşır mısınız?', type: 'TEXT', senderType: 'AGENT', senderId: user.id, status: 'READ' },
      { conversationId: conversation.id, content: 'Sipariş numaram: #12345', type: 'TEXT', senderType: 'VISITOR', status: 'SENT' },
    ],
  })

  await prisma.cannedResponse.createMany({
    data: [
      { websiteId: website.id, title: 'Hoş Geldin', content: 'Merhaba! Size nasıl yardımcı olabiliriz?', shortcut: '/merhaba', category: 'Genel' },
      { websiteId: website.id, title: 'İade Süreci', content: 'İade sürecinizi başlatmanıza yardımcı olayım.', shortcut: '/iade', category: 'Destek' },
    ],
  })

  console.log('\n🎉 Seed completed!')
  console.log('📧 Login: demo@gulive.com')
  console.log('🔑 Password: demo123')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())