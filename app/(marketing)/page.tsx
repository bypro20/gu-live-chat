import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JsonLd } from '@/components/marketing/json-ld'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, LiveTranslateSection, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
  HOME_FAQS,
} from '@/components/marketing/home-sections'
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
      <AiShowcase />
      <LiveTranslateSection />
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
