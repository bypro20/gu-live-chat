import { PrismaClient, PurchaseType } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { ADDON_SEED_CATALOG } from '../lib/addon-catalog'

function createSeedClient() {
  const url = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  if (url.startsWith('libsql://')) {
    const authToken = process.env.TURSO_AUTH_TOKEN || ''
    return new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) })
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
}

const prisma = createSeedClient()

async function main() {
  console.log(' Gu Live Chat eklentileri seedleniyor...')

  for (const item of ADDON_SEED_CATALOG) {
    const data = {
      slug: item.slug,
      name: item.name,
      description: item.description,
      longDescription: item.longDescription,
      category: item.category,
      icon: item.icon,
      imageUrl: null,
      price: item.price,
      purchaseType: item.purchaseType,
      isFeatured: item.isFeatured,
      version: '1.0.0',
      developer: 'Gu Live Chat',
      docsUrl: null,
      configSchema: item.configSchema ? JSON.stringify(item.configSchema) : null,
      permissions: JSON.stringify(['feature:use']),
      setupGuide: item.setupGuide,
      isActive: true,
    }

    const existing = await prisma.addon.findUnique({ where: { slug: item.slug } })

    if (!existing) {
      await prisma.addon.create({ data })
      console.log(`  ✅ ${item.name} eklendi`)
    } else {
      await prisma.addon.update({ where: { slug: item.slug }, data })
      console.log(`  🔄 ${item.name} güncellendi`)
    }
  }

  // Deactivate removed/broken addons
  const activeSlugs = ADDON_SEED_CATALOG.map((a) => a.slug)
  const deactivated = await prisma.addon.updateMany({
    where: { slug: { notIn: activeSlugs }, isActive: true },
    data: { isActive: false },
  })
  if (deactivated.count > 0) {
    console.log(`  🚫 ${deactivated.count} eski eklenti devre dışı bırakıldı`)
  }

  console.log(`✨ ${ADDON_SEED_CATALOG.length} eklenti başarıyla seedlendi!`)
}

main()
  .catch((e) => {
    console.error(' Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
