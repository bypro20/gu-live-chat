import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/marketing/google-analytics'
import { MetaPixel } from '@/components/marketing/meta-pixel'
import { LinkedInInsight } from '@/components/marketing/linkedin-insight'

/** Vercel Analytics + GA4 + Meta Pixel + LinkedIn */
export function SiteAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics />
      <MetaPixel />
      <LinkedInInsight />
    </>
  )
}
