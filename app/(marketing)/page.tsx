import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JsonLd } from '@/components/marketing/json-ld'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, LiveTranslateSection, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
} from '@/components/marketing/home-sections'
import { WidgetInstallStrip, AnalyticsStrip, PaymentFlowStrip } from '@/components/marketing/feature-micro-showcases'
import { getHomeFaqs } from '@/lib/home-faqs'
import { getServerLocaleContext } from '@/lib/locale-server'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'
import { faqJsonLd, softwareApplicationJsonLd } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata('home')
}

export default async function HomePage() {
  const { locale } = await getServerLocaleContext()
  const contentLocale = locale === 'en' ? 'en' : 'tr'
  const faqs = getHomeFaqs(locale)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={[softwareApplicationJsonLd(contentLocale), faqJsonLd(faqs)]} />
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
