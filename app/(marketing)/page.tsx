import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SiteWidget } from '@/components/marketing/site-widget'
import { prisma } from '@/lib/db'
import {
  HomeHero, TrustStrip, FeatureGrid, AiShowcase, SharedInbox,
  KnowledgeBaseSection, AiAutomationSection, ProductDeepDive,
  UseCasesTabs, PricingSection, TestimonialsSection, FaqSection, FooterCta,
} from '@/components/marketing/home-sections'

// Prisma (better-sqlite3 / libsql adapter) için Node.js runtime gerekir.
export const runtime = 'nodejs'

// websiteId DB'den çözülür; ISR ile periyodik olarak yeniden hesaplanır; böylece
// deploy sonrası ilk website oluşturulduğunda widget kendiliğinden görünür hale
// gelir (yeniden deploy gerektirmez).
export const revalidate = 600

/**
 * Ana sayfada gösterilecek widget'ın public websiteId'sini çözer.
 * Öncelik: (a) NEXT_PUBLIC_WIDGET_WEBSITE_ID env override, (b) DB'deki en eski
 * (birincil) Website kaydının public `websiteId` alanı. Hiç site yoksa null.
 *
 * Public `websiteId` kullanılır çünkü hem iframe route'u (app/widget/[websiteId])
 * hem de /api/widget/init bu public alanı bekler (prisma.website.findUnique
 * { where: { websiteId } }), internal cuid `id` değil.
 */
async function resolveWidgetWebsiteId(): Promise<string | null> {
  const override = process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID
  if (override) return override

  try {
    const website = await prisma.website.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { websiteId: true },
    })
    return website?.websiteId ?? null
  } catch {
    return null
  }
}

export default async function HomePage() {
  const widgetWebsiteId = await resolveWidgetWebsiteId()

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
      {widgetWebsiteId && <SiteWidget websiteId={widgetWebsiteId} />}
    </div>
  )
}
