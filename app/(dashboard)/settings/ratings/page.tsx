'use client'

import { useCallback, useEffect, useState } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

interface Rating {
  id: string
  rating: number
  comment: string | null
  ratedAt: string
  conversation: {
    id: string
    visitor: { name: string | null; email: string | null }
  }
}

export default function RatingsPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('ratings')
  const { activeWebsite } = useActiveWebsite()
  const { ratings: t, common, dateLocale } = useSettingsI18n()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRatings = useCallback(async () => {
    if (!activeWebsite?.websiteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ratings?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setRatings(await res.json())
    } finally {
      setLoading(false)
    }
  }, [activeWebsite?.websiteId])

  useEffect(() => { fetchRatings() }, [fetchRatings])

  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : '—'

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="ratings" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">{t.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t.subtitle}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="surface p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avg}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.avgScore}</p>
        </div>
        <div className="surface p-4 text-center">
          <p className="text-2xl font-bold">{ratings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.totalRatings}</p>
        </div>
        <div className="surface p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold">
            {ratings.filter((r) => r.rating >= 4).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t.fourFiveStars}</p>
        </div>
      </div>

      <div className="surface divide-y divide-border">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ratings.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          ratings.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex justify-between gap-2">
                <p className="font-medium text-sm">
                  {r.conversation.visitor.name || r.conversation.visitor.email || common.anonymous}
                </p>
                <span className="text-amber-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(r.ratedAt).toLocaleString(dateLocale)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
