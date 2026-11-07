import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JsonLd } from '@/components/marketing/json-ld'
import { PricingSection, FaqSection } from '@/components/marketing/home-sections'
import {
  HomeHeroV2, ChannelsV2, InstallV2, FeaturesV2, AiHumanV2, TrustV2, FinalCtaV2,
} from '@/components/marketing/home-v2/sections'
import { CinemaHero } from '@/components/marketing/home-v2/cinema-hero'
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
      <MarketingNav tone="dark" />
      <CinemaHero />
      <HomeHeroV2 />
      <ChannelsV2 />
      <InstallV2 />
      <FeaturesV2 />
      <AiHumanV2 />
      <TrustV2 />
      <div className="dark hv2-scope">
        <div className="hv2-divider" />
        <PricingSection />
        <FaqSection />
      </div>
      <FinalCtaV2 />
      <MarketingFooter tone="dark" />
    </div>
  )
}
