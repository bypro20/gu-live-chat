import {
  MARKETING_AI_BRAND_NAME,
  MARKETING_DEFAULT_BOT_AVATAR,
  toPublicAssetUrl,
} from './marketing-demo-agents'

export type WidgetBotIdentity = {
  displayName: string
  avatarUrl: string | null
}

/** Widget header, bot replies, and typing indicator share this identity. */
export function resolveWidgetBotIdentity(params: {
  websiteName?: string | null
  avatarUrl?: string | null
  isMarketing: boolean
  origin?: string
}): WidgetBotIdentity {
  const displayName = params.isMarketing
    ? MARKETING_AI_BRAND_NAME
    : (params.websiteName || 'Destek').trim()

  const avatarUrl =
    params.avatarUrl ||
    (params.isMarketing ? toPublicAssetUrl(MARKETING_DEFAULT_BOT_AVATAR, params.origin) : null)

  return { displayName, avatarUrl }
}
