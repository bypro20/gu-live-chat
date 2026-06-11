import { Suspense } from 'react'
import PlansPageContent from './plans-page-content'

function PlansLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl flex items-center justify-center h-64">
      <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={<PlansLoading />}>
      <PlansPageContent />
    </Suspense>
  )
}
