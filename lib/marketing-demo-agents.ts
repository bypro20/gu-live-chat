/** Marketing homepage widget — realistic demo support team personas. */

import { getSiteUrl } from './site-config'

export type MarketingDemoAgent = {
  name: string
  fullName: string
  image: string
}

export const MARKETING_DEMO_AGENTS: MarketingDemoAgent[] = [
  {
    name: 'Deniz',
    fullName: 'Deniz Arslan',
    image: '/marketing/agents/deniz.jpg',
  },
  {
    name: 'Emre',
    fullName: 'Emre Kaya',
    image: '/marketing/agents/emre.jpg',
  },
  {
    name: 'Selin',
    fullName: 'Selin Demir',
    image: '/marketing/agents/selin.jpg',
  },
]

export const MARKETING_PRIMARY_AGENT = MARKETING_DEMO_AGENTS[0]

/** Company name in site settings — widget shows the human agent instead. */
export const MARKETING_WIDGET_DISPLAY_NAME = 'Gu Live Chat'

/** Header subtitle under agent name (Tidio/Crisp pattern). */
export const MARKETING_AGENT_TITLE = 'Müşteri Destek Uzmanı · Genellikle birkaç dakika içinde yanıt verir'

/** Legacy export — bot replies use the primary agent full name. */
export const MARKETING_AI_BRAND_NAME = MARKETING_PRIMARY_AGENT.fullName

export const MARKETING_WIDGET_WELCOME =
  'Merhaba! 👋 Ben Deniz, Gu Live Chat ekibinden. Canlı destek widget\'ı, AI asistan ve fiyat paketleri hakkında sorularınızı yanıtlayabilirim — ne merak ediyorsunuz?'

export function toPublicAssetUrl(path: string | null | undefined, origin?: string): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = (origin || (typeof window !== 'undefined' ? window.location.origin : getSiteUrl())).replace(
    /\/$/,
    ''
  )
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMarketingWelcomeReply(agentName: string): string {
  const firstName = agentName.split(/\s+/)[0] || agentName
  return `Merhaba! 👋 Ben ${firstName}, Gu Live Chat ekibinden. Canlı destek, AI asistan ve fiyat paketleri hakkında sorularınızı yanıtlayabilirim — ne merak ediyorsunuz?`
}

export function getMarketingWidgetPersona(origin?: string) {
  const agent = MARKETING_PRIMARY_AGENT
  return {
    displayName: agent.name,
    botName: agent.fullName,
    agentTitle: MARKETING_AGENT_TITLE,
    avatarUrl: toPublicAssetUrl(agent.image, origin)!,
    team: MARKETING_DEMO_AGENTS.map((a) => ({
      ...a,
      image: toPublicAssetUrl(a.image, origin)!,
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
  agentDisplayName?: string | null
  agentTitle?: string | null
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
    agentDisplayName: config.agentDisplayName || MARKETING_PRIMARY_AGENT.fullName,
    agentTitle: config.agentTitle || MARKETING_AGENT_TITLE,
  }
}
