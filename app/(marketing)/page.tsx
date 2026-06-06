'use client'

import { useEffect } from 'react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
} from '@/components/marketing/home-sections'

export default function HomePage() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID
    if (!websiteId) return

    const w = window as Window & {
      GU_WIDGET_URL?: string
      $gu?: { q?: unknown[][] } & ((...args: unknown[]) => void)
    }
    w.GU_WIDGET_URL = window.location.origin
    w.$gu = w.$gu || function (...args: unknown[]) {
      (w.$gu!.q = w.$gu!.q || []).push(args)
    }
    w.$gu('set', 'WEBSITE_ID', websiteId)

    if (document.querySelector('script[data-gu-widget]')) return
    const script = document.createElement('script')
    script.src = '/widget.js'
    script.async = true
    script.setAttribute('data-gu-widget', '1')
    document.body.appendChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <HomeHero />
      <TrustStrip />
      <FeatureGrid />
      <AiShowcase />
      <SharedInbox />
      <KnowledgeBaseSection />
      <AiAutomationSection />
      <ProductDeepDive />
      <UseCasesTabs />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FooterCta />
      <MarketingFooter />
    </div>
  )
}
