/** Marketing homepage widget — realistic demo support team personas. */

import { getSiteUrl } from './site-config'

export type MarketingDemoAgent = {
  name: string
  fullName: string
  image: string
}

/** Stable HTTPS headshots — works before /public assets are deployed. */
export const MARKETING_DEMO_AGENTS: MarketingDemoAgent[] = [
  {
    name: 'Deniz',
    fullName: 'Deniz Arslan',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
  },
  {
    name: 'Emre',
    fullName: 'Emre Kaya',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop&crop=faces',
  },
  {
    name: 'Selin',
    fullName: 'Selin Demir',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=faces',
  },
]

export const MARKETING_PRIMARY_AGENT = MARKETING_DEMO_AGENTS[0]

/** Shown in widget header / bot replies on gulivechat.com */
export const MARKETING_WIDGET_DISPLAY_NAME = `${MARKETING_PRIMARY_AGENT.name} · Destek`

export const MARKETING_WIDGET_WELCOME =
  'Merhaba! 👋 Fiyat, kurulum ve özellikler hakkında sorularınızı yanıtlayabilirim.'

export function toPublicAssetUrl(path: string | null | undefined, origin?: string): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = (origin || (typeof window !== 'undefined' ? window.location.origin : getSiteUrl())).replace(
    /\/$/,
    ''
  )
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function getMarketingWidgetPersona(origin?: string) {
  return {
    displayName: MARKETING_WIDGET_DISPLAY_NAME,
    botName: MARKETING_PRIMARY_AGENT.fullName,
    avatarUrl: toPublicAssetUrl(MARKETING_PRIMARY_AGENT.image, origin)!,
    team: MARKETING_DEMO_AGENTS.map((agent) => ({
      ...agent,
      image: toPublicAssetUrl(agent.image, origin)!,
    })),
  }
}

export function resolveMarketingAgentImage(
  name: string | null | undefined,
  origin?: string
): string | null {
  if (!name) return toPublicAssetUrl(MARKETING_PRIMARY_AGENT.image, origin)
  const normalized = name.toLowerCase()
  const match = MARKETING_DEMO_AGENTS.find(
    (a) =>
      normalized.includes(a.name.toLowerCase()) ||
      normalized.includes(a.fullName.toLowerCase())
  )
  return toPublicAssetUrl(match?.image ?? MARKETING_PRIMARY_AGENT.image, origin)
}

export type WidgetBrandingFields = {
  avatarUrl: string | null
  websiteName: string | null
  welcomeMessage: string | null
}

/** Marketing sitesinde widget teaser + iframe için marka alanlarını doldurur. */
export function applyMarketingWidgetBranding(
  config: WidgetBrandingFields,
  _origin?: string
): WidgetBrandingFields {
  const legacyName =
    !config.websiteName ||
    config.websiteName === 'Gu Live Chat — Platform' ||
    config.websiteName.includes('Gu Live Chat')

  return {
    avatarUrl: config.avatarUrl || MARKETING_PRIMARY_AGENT.image,
    websiteName: legacyName ? MARKETING_WIDGET_DISPLAY_NAME : config.websiteName,
    welcomeMessage: config.welcomeMessage || MARKETING_WIDGET_WELCOME,
  }
}
