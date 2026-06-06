import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  
  // Use Turso adapter in production, SQLite adapter locally
  if (url.startsWith('libsql://')) {
    const authToken = process.env.TURSO_AUTH_TOKEN || ''
    const adapter = new PrismaLibSql({ url, authToken })
    return new PrismaClient({ adapter })
  }
  
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma