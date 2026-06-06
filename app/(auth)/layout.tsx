import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </SessionProvider>
  )
}