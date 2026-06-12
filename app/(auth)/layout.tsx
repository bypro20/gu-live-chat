import { getServerLocaleContext } from '@/lib/locale-server'
import { AuthShell } from './auth-shell'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialLocale = await getServerLocaleContext()
  return <AuthShell initialLocale={initialLocale}>{children}</AuthShell>
}
