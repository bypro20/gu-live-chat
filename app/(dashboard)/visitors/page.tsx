'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { AdminVisitorsMonitor } from '@/components/admin/admin-visitors-monitor'

function VisitorsMonitorContent() {
  const { activeWebsite, websites } = useActiveWebsite()
  const searchParams = useSearchParams()
  const initialVisitorId = searchParams.get('visitor')

  return (
    <AdminVisitorsMonitor
      variant="dashboard"
      websiteId={activeWebsite?.websiteId ?? null}
      websiteIds={websites.map((w) => w.websiteId)}
      initialVisitorId={initialVisitorId}
    />
  )
}

export default function VisitorsPage() {
  return (
    <div className="h-full min-h-0 w-full max-w-full flex flex-col overflow-hidden bg-[#080C14] p-2 lg:p-4">
      <Suspense fallback={null}>
        <VisitorsMonitorContent />
      </Suspense>
    </div>
  )
}
