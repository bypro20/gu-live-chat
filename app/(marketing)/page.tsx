import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SiteWidget } from '@/components/marketing/site-widget'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
} from '@/components/marketing/home-sections'

export default function HomePage() {
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
      <SiteWidget />
    </div>
  )
}
