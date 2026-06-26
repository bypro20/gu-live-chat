'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { Button } from '@/components/ui/button'

type SetupSite = {
  websiteId: string
  name: string
  domain?: string | null
}

export function AdminMarketingWorkspace({ children }: { children: React.ReactNode }) {
  const { switchWebsite, activeWebsite, refreshWebsites } = useActiveWebsite()
  const [target, setTarget] = useState<SetupSite | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setTarget(null)

    fetch('/api/admin/inbox/setup', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error([data.error, data.detail].filter(Boolean).join(' — ') || 'Kurulum başarısız')
        }
        return data as SetupSite
      })
      .then((site) => {
        if (cancelled || !site.websiteId) return
        setTarget(site)
        switchWebsite(site.websiteId)
        void refreshWebsites()
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Site yüklenemedi')
      })

    return () => {
      cancelled = true
    }
  }, [switchWebsite, refreshWebsites])

  const ready = !!target && activeWebsite?.websiteId === target.websiteId

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center gap-3">
        <p className="text-sm text-destructive font-medium max-w-md">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Yeniden dene
        </Button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Marketing sitesi hazırlanıyor…</p>
      </div>
    )
  }

  return <>{children}</>
}
