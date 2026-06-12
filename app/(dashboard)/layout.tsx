import { DashboardProviders } from '@/components/dashboard/dashboard-providers'
import { getServerLocaleContext } from '@/lib/locale-server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocaleContext()

  return <DashboardProviders initialLocale={initialLocale}>{children}</DashboardProviders>
}
