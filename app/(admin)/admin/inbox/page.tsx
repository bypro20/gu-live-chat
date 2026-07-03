'use client'

import { Suspense } from 'react'
import { AdminInboxPanel } from '@/components/admin/admin-inbox-panel'

export default function AdminInboxPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <Suspense fallback={
        <div className="inbox-shell flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AdminInboxPanel />
      </Suspense>
    </div>
  )
}
