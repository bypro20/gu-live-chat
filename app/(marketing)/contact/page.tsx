import { Suspense } from 'react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { ContactPageClient } from './contact-client'

function ContactFallback() {
  return (
    <MarketingPageShell>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </MarketingPageShell>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<ContactFallback />}>
      <ContactPageClient />
    </Suspense>
  )
}
