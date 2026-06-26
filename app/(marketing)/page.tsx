import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JsonLd } from '@/components/marketing/json-ld'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase,
  PricingSection, TestimonialsSection, FaqSection,
} from '@/components/marketing/home-sections'
import {
  HeroFeaturePills,
  ServicesOfferGrid,
  AboutSplitSection,
  HowItWorksSteps,
  DarkFeatureGrid,
  FullWidthCtaBanner,
} from '@/components/marketing/ecall-home-blocks'
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
      <HeroFeaturePills />
      <AboutSplitSection />
      <ServicesOfferGrid />
      <TrustStrip />
      <FeatureGrid />
      <HowItWorksSteps />
      <DarkFeatureGrid />
      <AiShowcase />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FullWidthCtaBanner />
      <MarketingFooter />
    </div>
  )
}
