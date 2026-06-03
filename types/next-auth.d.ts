import 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    role?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      activeWebsiteId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    activeWebsiteId?: string
  }
}