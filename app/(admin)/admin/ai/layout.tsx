'use client'

import { AdminAiNav } from '@/components/admin/admin-ai-nav'
import { AdminMarketingWorkspace } from '@/components/admin/admin-marketing-workspace'

export default function AdminAiLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminMarketingWorkspace>
      <div className="flex flex-col min-h-0 h-full">
        <AdminAiNav />
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </AdminMarketingWorkspace>
  )
}
