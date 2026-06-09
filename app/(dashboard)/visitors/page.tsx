'use client'

import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { AdminVisitorsMonitor } from '@/components/admin/admin-visitors-monitor'

export default function VisitorsPage() {
  const { activeWebsite, websites } = useActiveWebsite()

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-screen flex flex-col overflow-hidden bg-[#080C14] p-2 lg:p-4">
      <AdminVisitorsMonitor
        variant="dashboard"
        websiteId={activeWebsite?.websiteId ?? null}
        websiteIds={websites.map((w) => w.websiteId)}
      />
    </div>
  )
}
