import { prisma } from '@/lib/db'
import { marketingDomainVariants } from '@/lib/site-config'
import type { MetaChannelConfig } from '@/lib/channels/meta'

const CREDENTIALS_KEY = 'marketing_publish_credentials'

export type MarketingPublishCredentials = {
  linkedinAccessToken?: string
  linkedinAuthorUrn?: string
  metaPageId?: string
  metaPageAccessToken?: string
  metaInstagramBusinessId?: string
  metaAdAccountId?: string
  xBearerToken?: string
  shareImageUrl?: string
  autoPublishSocial: boolean
  autoLaunchPaidAds: boolean
  updatedAt?: string
}

const ENV_DEFAULTS: MarketingPublishCredentials = {
  linkedinAccessToken: process.env.LINKEDIN_ACCESS_TOKEN?.trim(),
  linkedinAuthorUrn: process.env.LINKEDIN_AUTHOR_URN?.trim(),
  metaPageId: process.env.META_PAGE_ID?.trim(),
  metaPageAccessToken: process.env.META_PAGE_ACCESS_TOKEN?.trim(),
  metaInstagramBusinessId: process.env.META_INSTAGRAM_BUSINESS_ID?.trim(),
  metaAdAccountId: process.env.META_AD_ACCOUNT_ID?.trim(),
  xBearerToken: process.env.X_BEARER_TOKEN?.trim(),
  shareImageUrl:
    process.env.MARKETING_SHARE_IMAGE_URL?.trim() ||
    'https://www.gulivechat.com/opengraph-image',
  autoPublishSocial: process.env.MARKETING_AUTO_PUBLISH_SOCIAL !== 'false',
  autoLaunchPaidAds: process.env.MARKETING_AUTO_LAUNCH_PAID_ADS !== 'false',
}

function mergeCredentials(
  stored: Partial<MarketingPublishCredentials> | null,
  metaFromDb?: MetaChannelConfig | null,
  instagramBusinessId?: string | null
): MarketingPublishCredentials {
  const pageId = stored?.metaPageId || ENV_DEFAULTS.metaPageId || metaFromDb?.pageId
  const pageToken =
    stored?.metaPageAccessToken ||
    ENV_DEFAULTS.metaPageAccessToken ||
    metaFromDb?.pageAccessToken ||
    metaFromDb?.accessToken

  return {
    linkedinAccessToken: stored?.linkedinAccessToken || ENV_DEFAULTS.linkedinAccessToken,
    linkedinAuthorUrn: stored?.linkedinAuthorUrn || ENV_DEFAULTS.linkedinAuthorUrn,
    metaPageId: pageId,
    metaPageAccessToken: pageToken,
    metaInstagramBusinessId:
      stored?.metaInstagramBusinessId ||
      ENV_DEFAULTS.metaInstagramBusinessId ||
      instagramBusinessId ||
      undefined,
    metaAdAccountId:
      stored?.metaAdAccountId || ENV_DEFAULTS.metaAdAccountId || metaFromDb?.businessAccountId,
    xBearerToken: stored?.xBearerToken || ENV_DEFAULTS.xBearerToken,
    shareImageUrl: stored?.shareImageUrl || ENV_DEFAULTS.shareImageUrl,
    autoPublishSocial:
      stored?.autoPublishSocial ?? ENV_DEFAULTS.autoPublishSocial ?? true,
    autoLaunchPaidAds: stored?.autoLaunchPaidAds ?? ENV_DEFAULTS.autoLaunchPaidAds ?? true,
    updatedAt: stored?.updatedAt,
  }
}

async function loadMetaFromMarketingWebsite(): Promise<{
  meta?: MetaChannelConfig
  instagramBusinessId?: string
}> {
  try {
    const site = await findMarketingWebsiteInDb()
    if (!site) return {}

    const [messenger, instagram] = await Promise.all([
      prisma.channelIntegration.findFirst({
        where: { websiteId: site.id, type: 'MESSENGER', isActive: true },
        select: { config: true },
      }),
      prisma.channelIntegration.findFirst({
        where: { websiteId: site.id, type: 'INSTAGRAM', isActive: true },
        select: { config: true },
      }),
    ])

    let meta: MetaChannelConfig | undefined
    for (const row of [messenger, instagram]) {
      if (!row?.config) continue
      try {
        const parsed = JSON.parse(row.config) as MetaChannelConfig
        meta = { ...meta, ...parsed }
      } catch {
        /* ignore */
      }
    }

    let instagramBusinessId: string | undefined
    if (meta?.pageId && meta?.pageAccessToken) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${meta.pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(meta.pageAccessToken)}`,
          { signal: AbortSignal.timeout(8000) }
        )
        const data = (await res.json()) as {
          instagram_business_account?: { id?: string }
          error?: { message?: string }
        }
        instagramBusinessId = data.instagram_business_account?.id
      } catch {
        /* ignore */
      }
    }

    return { meta, instagramBusinessId }
  } catch {
    return {}
  }
}

export async function getMarketingPublishCredentials(): Promise<MarketingPublishCredentials> {
  let stored: Partial<MarketingPublishCredentials> | null = null
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: CREDENTIALS_KEY } })
    if (row?.value) stored = JSON.parse(row.value) as Partial<MarketingPublishCredentials>
  } catch {
    /* ignore */
  }

  const { meta, instagramBusinessId } = await loadMetaFromMarketingWebsite()
  return mergeCredentials(stored, meta, instagramBusinessId)
}

export async function saveMarketingPublishCredentials(
  patch: Partial<MarketingPublishCredentials>
): Promise<MarketingPublishCredentials> {
  const current = await getMarketingPublishCredentials()
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  await prisma.platformSetting.upsert({
    where: { key: CREDENTIALS_KEY },
    create: { key: CREDENTIALS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })
  return next
}

export function channelPublishReady(
  channel: string,
  creds: MarketingPublishCredentials
): boolean {
  switch (channel) {
    case 'linkedin':
      return Boolean(creds.linkedinAccessToken && creds.linkedinAuthorUrn)
    case 'instagram':
      return Boolean(creds.metaInstagramBusinessId && creds.metaPageAccessToken && creds.shareImageUrl)
    case 'x':
      return Boolean(creds.xBearerToken)
    case 'tiktok':
      return false
    default:
      return Boolean(creds.metaPageId && creds.metaPageAccessToken)
  }
}

async function findMarketingWebsiteInDb() {
  const override =
    process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim()

  if (override) {
    const byId = await prisma.website.findUnique({
      where: { websiteId: override },
      select: { id: true, websiteId: true, name: true, domain: true },
    })
    if (byId) return byId
  }

  return prisma.website.findFirst({
    where: { domain: { in: marketingDomainVariants() } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, websiteId: true, name: true, domain: true },
  })
}
