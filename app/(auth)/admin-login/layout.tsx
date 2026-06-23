import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Platform Yönetimi Girişi',
  description: 'Gu Live Chat platform yönetim paneli girişi.',
  path: '/admin-login',
  robots: { index: false, follow: false },
})

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
