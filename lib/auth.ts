import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { generateWebsiteId } from './utils'

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
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
          allowDangerousEmailAccountLinking: true,
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
      try {
        // Ban check — applies to all providers
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
        // On first sign in, get role and activeWebsiteId from DB
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, activeWebsiteId: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.activeWebsiteId = dbUser.activeWebsiteId || undefined
          }
        }

        // On session update, refresh from DB
        if (trigger === 'update' && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
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
            where: { email: token.email as string },
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
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})
