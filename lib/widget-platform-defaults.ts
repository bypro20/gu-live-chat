/** Gu Live Chat platform standardı — tüm müşteri embed'lerinde varsayılan kimlik kapısı */

export const WIDGET_IDENTITY_DEFAULTS = {
  showPreChatForm: true,
  requireName: true,
  requireEmail: true,
} as const

export type WidgetIdentityFields = {
  showPreChatForm?: boolean | null
  requireName?: boolean | null
  requireEmail?: boolean | null
}

export type ResolvedWidgetIdentity = {
  showPreChatForm: boolean
  requireName: boolean
  requireEmail: boolean
}

/** DB null / eski kayıtlar → platform varsayılanı (ad + e-posta zorunlu) */
export function withWidgetIdentityDefaults(
  config: WidgetIdentityFields | null | undefined,
): ResolvedWidgetIdentity {
  return {
    showPreChatForm:
      config?.showPreChatForm ?? WIDGET_IDENTITY_DEFAULTS.showPreChatForm,
    requireName: config?.requireName ?? WIDGET_IDENTITY_DEFAULTS.requireName,
    requireEmail: config?.requireEmail ?? WIDGET_IDENTITY_DEFAULTS.requireEmail,
  }
}

export const WIDGET_IDENTITY_CREATE_DATA = { ...WIDGET_IDENTITY_DEFAULTS }
