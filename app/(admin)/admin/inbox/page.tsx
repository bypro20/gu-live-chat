'use client'

import { Suspense } from 'react'
import { AdminInboxPanel } from '@/components/admin/admin-inbox-panel'

export default function AdminInboxPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Suspense fallback={
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AdminInboxPanel />
      </Suspense>
    </div>
  )
}
