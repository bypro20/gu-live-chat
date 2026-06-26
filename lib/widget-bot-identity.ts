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

/** Widget header, bot replies, and typing share this human-facing identity. */
export function resolveWidgetAgentIdentity(params: {
  websiteName?: string | null
  agentDisplayName?: string | null
  agentTitle?: string | null
  avatarUrl?: string | null
  isMarketing: boolean
  origin?: string
}): WidgetAgentIdentity {
  if (params.isMarketing) {
    const agent = MARKETING_PRIMARY_AGENT
    const avatarUrl =
      params.avatarUrl || toPublicAssetUrl(agent.image, params.origin)
    const teamAvatars = MARKETING_DEMO_AGENTS.map(
      (a) => toPublicAssetUrl(a.image, params.origin)!
    ).filter(Boolean)
    const replyName = agent.fullName
    return {
      headerName: agent.name,
      replyName,
      title: params.agentTitle?.trim() || MARKETING_AGENT_TITLE,
      avatarUrl,
      teamAvatars,
      displayName: replyName,
    }
  }

  const replyName = (params.agentDisplayName || params.websiteName || 'Destek').trim()
  const avatarUrl = params.avatarUrl || null

  return {
    headerName: firstName(replyName),
    replyName,
    title: params.agentTitle?.trim() || DEFAULT_REPLY_SLA,
    avatarUrl,
    teamAvatars: avatarUrl ? [avatarUrl] : [],
    displayName: replyName,
  }
}

/** Backward-compatible alias */
export const resolveWidgetBotIdentity = resolveWidgetAgentIdentity

export type WidgetBotIdentity = WidgetAgentIdentity
