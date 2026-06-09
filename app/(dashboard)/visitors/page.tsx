'use client'

import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { AdminVisitorsMonitor } from '@/components/admin/admin-visitors-monitor'

export default function VisitorsPage() {
  const { activeWebsite, websites } = useActiveWebsite()

  return (
    <div className="h-full min-h-0 w-full max-w-full flex flex-col overflow-hidden bg-[#080C14] p-2 lg:p-4">
      <AdminVisitorsMonitor
        variant="dashboard"
        websiteId={activeWebsite?.websiteId ?? null}
        websiteIds={websites.map((w) => w.websiteId)}
      />
    </div>
  )
}
