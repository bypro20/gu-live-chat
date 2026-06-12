import { SiteWidget } from '@/components/marketing/site-widget'
import { resolveOrBootstrapMarketingWebsiteId } from '@/lib/marketing-website'

const ENV_MARKETING_ID =
  process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim() ||
  process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim() ||
  ''

/** Tüm marketing sayfalarında sağ alttaki canlı widget (gulivechat.com). */
export async function MarketingWidgetLoader() {
  const websiteId = (await resolveOrBootstrapMarketingWebsiteId()) || ENV_MARKETING_ID || null
  if (!websiteId) return null
  return <SiteWidget websiteId={websiteId} />
}
