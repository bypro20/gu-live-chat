import {
  applyMarketingWidgetBranding,
  type WidgetBrandingFields,
} from './marketing-demo-agents'
import { isKnownMarketingWebsitePublicId, isPlatformMarketingWebsiteId } from './marketing-website'

export async function isMarketingWidgetWebsite(websiteId: string): Promise<boolean> {
  if (isKnownMarketingWebsitePublicId(websiteId)) return true
  return isPlatformMarketingWebsiteId(websiteId)
}

export async function resolveMarketingWidgetBranding(
  websiteId: string,
  config: WidgetBrandingFields,
  origin?: string
): Promise<WidgetBrandingFields> {
  if (!(await isMarketingWidgetWebsite(websiteId))) return config
  return applyMarketingWidgetBranding(config, origin)
}
