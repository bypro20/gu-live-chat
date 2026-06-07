import { SiteWidget } from '@/components/marketing/site-widget'
import { resolveOrBootstrapMarketingWebsiteId } from '@/lib/marketing-website'

/** Tüm marketing sayfalarında sağ alttaki canlı widget (guchat.org). */
export async function MarketingWidgetLoader() {
  const websiteId = await resolveOrBootstrapMarketingWebsiteId()
  if (!websiteId) return null
  return <SiteWidget websiteId={websiteId} />
}
