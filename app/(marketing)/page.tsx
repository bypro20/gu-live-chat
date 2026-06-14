import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JsonLd } from '@/components/marketing/json-ld'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, LiveTranslateSection, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
} from '@/components/marketing/home-sections'
import { WidgetInstallStrip, AnalyticsStrip, PaymentFlowStrip } from '@/components/marketing/feature-micro-showcases'
import { HOME_FAQS } from '@/lib/home-faqs'
import { buildMetadata, faqJsonLd, softwareApplicationJsonLd, PAGE_SEO } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMetadata(PAGE_SEO.home)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={[softwareApplicationJsonLd(), faqJsonLd(HOME_FAQS)]} />
      <MarketingNav />
      <HomeHero />
      <TrustStrip />
      <FeatureGrid />
      <WidgetInstallStrip />
      <AiShowcase />
      <LiveTranslateSection />
      <SharedInbox />
      <KnowledgeBaseSection />
      <AiAutomationSection />
      <ProductDeepDive />
      <AnalyticsStrip />
      <UseCasesTabs />
      <PricingSection />
      <PaymentFlowStrip reverse />
      <TestimonialsSection />
      <FaqSection />
      <FooterCta />
      <MarketingFooter />
    </div>
  )
}
