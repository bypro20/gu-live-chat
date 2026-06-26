import {
  MARKETING_AGENT_TITLE,
  MARKETING_DEMO_AGENTS,
  MARKETING_PRIMARY_AGENT,
  toPublicAssetUrl,
} from './marketing-demo-agents'

export type WidgetAgentIdentity = {
  /** Widget header — usually first name */
  headerName: string
  /** Message bubbles and typing indicator */
  replyName: string
  /** Subtitle under header (Tidio/Crisp style) */
  title: string
  avatarUrl: string | null
  teamAvatars: string[]
  /** @deprecated use replyName */
  displayName: string
}

const DEFAULT_REPLY_SLA = 'Genellikle birkaç dakika içinde yanıt verir'

function firstName(full: string): string {
  const trimmed = full.trim()
  if (!trimmed) return 'Destek'
  return trimmed.split(/\s+/)[0] || trimmed
}

function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  origin?: string
): string | null {
  if (!avatarUrl?.trim()) return null
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl.trim()
  return toPublicAssetUrl(avatarUrl, origin)
}

/** Widget header, bot replies, and typing share this human-facing identity. */
export function resolveWidgetAgentIdentity(params: {
  websiteName?: string | null
  agentDisplayName?: string | null
  agentTitle?: string | null
  avatarUrl?: string | null
  isMarketing: boolean
  origin?: string
}): WidgetAgentIdentity {
  const customName = params.agentDisplayName?.trim()
  const fallbackName = params.isMarketing
    ? MARKETING_PRIMARY_AGENT.fullName
    : (params.websiteName?.trim() || 'Destek')
  const replyName = customName || fallbackName

  const customAvatar = resolveAvatarUrl(params.avatarUrl, params.origin)
  const avatarUrl =
    customAvatar ||
    (params.isMarketing ? toPublicAssetUrl(MARKETING_PRIMARY_AGENT.image, params.origin) : null)

  const title =
    params.agentTitle?.trim() ||
    (params.isMarketing ? MARKETING_AGENT_TITLE : DEFAULT_REPLY_SLA)

  const teamAvatars =
    params.isMarketing && !customAvatar
      ? MARKETING_DEMO_AGENTS.map(
          (a) => toPublicAssetUrl(a.image, params.origin)!
        ).filter(Boolean)
      : avatarUrl
        ? [avatarUrl]
        : []

  return {
    headerName: firstName(replyName),
    replyName,
    title,
    avatarUrl,
    teamAvatars,
    displayName: replyName,
  }
}

/** Backward-compatible alias */
export const resolveWidgetBotIdentity = resolveWidgetAgentIdentity

export type WidgetBotIdentity = WidgetAgentIdentity
