import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { generateWebsiteId } from './utils'
import { getAuthUrl, getSiteUrl } from './site-config'
import { checkRateLimit } from './rate-limit'

/** NextAuth callback URL — custom domain (gulivechat.com), not *.vercel.app */
function normalizeSiteUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.replace(/\/$/, '')
}

const PRODUCTION_SITE_URL = getSiteUrl()
const AUTH_SITE_URL = getAuthUrl()
const publicAppUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL)
const configuredAuthUrl = normalizeSiteUrl(
  process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
)

function isVercelAppUrl(url: string | undefined): boolean {
  return Boolean(url?.includes('vercel.app'))
}

// OAuth callback www üzerinden — apex DNS sorunlarında Google girişi kırılmasın
let resolvedAuthUrl = configuredAuthUrl ?? AUTH_SITE_URL
if (!resolvedAuthUrl || isVercelAppUrl(resolvedAuthUrl)) {
  resolvedAuthUrl =
    AUTH_SITE_URL && !isVercelAppUrl(AUTH_SITE_URL) ? AUTH_SITE_URL : PRODUCTION_SITE_URL
}
process.env.AUTH_URL = resolvedAuthUrl

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const email = (credentials.email as string).trim().toLowerCase()

          const limited = checkRateLimit(`login:${email}`, 12, 15 * 60_000)
          if (!limited.ok) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.passwordHash) {
            return null
          }

          if (user.isBanned) {
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (err) {
          console.error('[Auth] authorize error:', err)
          return null
        }
      },
    }),
    // Google OAuth — only active when env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
          allowDangerousEmailAccountLinking: false,
        })]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials: authorize() already checked password + ban — avoid extra DB calls
      // that can fail in serverless/Turso and incorrectly block admin login.
      if (account?.provider === 'credentials') {
        return true
      }

      try {
        // Ban check — OAuth providers
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { isBanned: true },
          })
          if (dbUser?.isBanned) return false
        }

        // Google OAuth: create or link account
        if (account?.provider === 'google') {
          if (!user.email) return false

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (!existingUser) {
            // New user: create account + default website atomically
            await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({
                data: {
                  email: user.email!,
                  name: user.name || user.email!.split('@')[0],
                  image: user.image,
                  passwordHash: null,
                  role: 'USER',
                  ownedWebsites: {
                    create: {
                      name: `${user.name || user.email!.split('@')[0]}'s Website`,
                      domain: `${user.email!.split('@')[0]}.gulive.com`,
                      websiteId: generateWebsiteId(),
                      plan: 'FREE',
                    },
                  },
                },
                include: { ownedWebsites: true },
              })

              const ownedWebsite = newUser.ownedWebsites[0]
              if (ownedWebsite) {
                await tx.teamMember.create({
                  data: {
                    userId: newUser.id,
                    websiteId: ownedWebsite.id,
                    role: 'OWNER',
                    acceptedAt: new Date(),
                  },
                })
                await tx.user.update({
                  where: { id: newUser.id },
                  data: { activeWebsiteId: ownedWebsite.websiteId },
                })
              }
            })
            return true
          }

          // Existing user: ensure they have TeamMember records
          const memberCount = await prisma.teamMember.count({
            where: { userId: existingUser.id },
          })

          if (memberCount === 0) {
            const ownedSites = await prisma.website.findMany({
              where: { ownerId: existingUser.id },
            })
            if (ownedSites.length > 0) {
              await prisma.$transaction(async (tx) => {
                for (const site of ownedSites) {
                  await tx.teamMember.upsert({
                    where: { userId_websiteId: { userId: existingUser.id, websiteId: site.id } },
                    create: { userId: existingUser.id, websiteId: site.id, role: 'OWNER', acceptedAt: new Date() },
                    update: { role: 'OWNER' },
                  })
                }
              })
            }
          }

          return true
        }

        return true
      } catch (err) {
        // Log but don't throw — a DB error should not block sign-in
        // and must not surface as a misleading "Configuration" error.
        console.error('[Auth] signIn callback error:', err)
        // For credentials provider, fail safely
        if (account?.provider === 'credentials') return false
        // For OAuth, allow sign-in to proceed even if post-processing failed
        return true
      }
    },
    async jwt({ token, user, trigger }) {
      try {
        // On first sign-in, trust authorize() output immediately so a transient
        // Turso/DB error cannot strip ADMIN role or user id from the session.
        const signInRole = user ? (user as { role?: string }).role : undefined
        if (user) {
          if (user.id) token.id = user.id
          if (user.email) token.email = user.email
          if (signInRole) token.role = signInRole
        }

        // Refresh role and activeWebsiteId from DB when possible (never clear role on failure)
        const email = (user?.email ?? token.email) as string | undefined
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            select: { id: true, role: true, activeWebsiteId: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.activeWebsiteId = dbUser.activeWebsiteId || undefined
          } else if (signInRole && !token.role) {
            token.role = signInRole
          }
        }

        // On session update, refresh from DB
        if (trigger === 'update' && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: (token.email as string).trim().toLowerCase() },
            select: { id: true, role: true, activeWebsiteId: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.activeWebsiteId = dbUser.activeWebsiteId || undefined
          }
        }

        // Lazy-load role if missing (e.g. after token rotation)
        if (!token.role && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: (token.email as string).trim().toLowerCase() },
            select: { id: true, role: true, activeWebsiteId: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.activeWebsiteId = dbUser.activeWebsiteId || undefined
          }
        }
      } catch (err) {
        console.error('[Auth] jwt callback error:', err)
        // Return token as-is — do not throw
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'USER'
        session.user.activeWebsiteId = (token.activeWebsiteId as string) || null
      }
      return session
    },
  },
  basePath: '/api/auth',
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})
