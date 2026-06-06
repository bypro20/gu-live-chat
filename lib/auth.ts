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
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isBanned: true },
        })
        if (dbUser?.isBanned) {
          return false
        }
      }

      // For Google OAuth, create or link user
      if (account?.provider === 'google') {
        if (!user.email) {
          return false // OAuth must provide email
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create user + default website in a transaction
          const result = await prisma.$transaction(async (tx) => {
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
              // Create TeamMember for the owner
              await tx.teamMember.create({
                data: {
                  userId: newUser.id,
                  websiteId: ownedWebsite.id,
                  role: 'OWNER',
                  acceptedAt: new Date(),
                },
              })

              // Set activeWebsiteId so they land on their website
              await tx.user.update({
                where: { id: newUser.id },
                data: { activeWebsiteId: ownedWebsite.websiteId },
              })
            }

            return newUser
          })

          return true
        }

        // Existing user: check if they have any team memberships
        // This handles users who were created before the TeamMember system
        const memberCount = await prisma.teamMember.count({
          where: { userId: existingUser.id },
        })

        if (memberCount === 0) {
          // User has no memberships — link them to their owned websites
          const ownedSites = await prisma.website.findMany({
            where: { ownerId: existingUser.id },
          })

          if (ownedSites.length > 0) {
            await prisma.$transaction(async (tx) => {
              for (const site of ownedSites) {
                await tx.teamMember.upsert({
                  where: {
                    userId_websiteId: {
                      userId: existingUser.id,
                      websiteId: site.id,
                    },
                  },
                  create: {
                    userId: existingUser.id,
                    websiteId: site.id,
                    role: 'OWNER',
                    acceptedAt: new Date(),
                  },
                  update: {
                    role: 'OWNER',
                  },
                })
              }
            })
          }
        }

        return true
      }

      return true
    },
    async jwt({ token, user, trigger }) {
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

      // On session update, refresh role and activeWebsiteId from DB
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

      // If role is missing, look it up from email
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
