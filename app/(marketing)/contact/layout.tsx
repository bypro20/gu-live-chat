import type { Metadata } from 'next'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata: Metadata = {
  title: 'İletişim',
  description: `Sorularınız, demo talepleri ve kurumsal çözümler için ${SITE_LEGAL.name} ekibiyle iletişime geçin.`,
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
