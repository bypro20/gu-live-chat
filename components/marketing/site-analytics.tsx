import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/marketing/google-analytics'

/** Vercel Analytics (otomatik) + opsiyonel GA4 */
export function SiteAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics />
    </>
  )
}
