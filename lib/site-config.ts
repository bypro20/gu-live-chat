/** Production domain — env ile override edilebilir */
export const SITE_DOMAIN =
  process.env.SITE_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') ||
  'gulivechat.com'

/** Kullanıcıya görünen marka adı */
export const SITE_NAME = process.env.PLATFORM_NAME?.trim() || 'Gu Live Chat'

/** Mobil manifest / dar alanlar */
export const SITE_NAME_SHORT = 'Gu Live'

export const SITE_NAME_ADMIN = `${SITE_NAME} Yönetim`

export const ADMIN_USER_DISPLAY_NAME = `${SITE_NAME} Platform Admin`

/** Android APK indirme */
export const APK_DOWNLOAD_PATH = '/downloads/gulivechat.apk'
export const APK_DOWNLOAD_FILENAME = 'GuLiveChat.apk'
export const LEGACY_APK_DOWNLOAD_PATH = '/downloads/guchat.apk'

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return `https://${SITE_DOMAIN}`
}

/** OAuth callback — www tercih (apex DNS önbelleğinde giriş kırılmasın) */
export function getAuthUrl(): string {
  const fromEnv =
    process.env.AUTH_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXTAUTH_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return `https://www.${SITE_DOMAIN}`
}

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || `destek@${SITE_DOMAIN}`
}

export function getContactEmail(): string {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    getSupportEmail()
  )
}

export function getNoreplyEmail(): string {
  return process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim() || `noreply@${SITE_DOMAIN}`
}

export function marketingDomainVariants(): string[] {
  const d = (
    process.env.MARKETING_WEBSITE_DOMAIN ||
    SITE_DOMAIN
  )
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  return [...new Set([
    d,
    `www.${d}`,
    `https://${d}`,
    `https://www.${d}`,
    `http://${d}`,
  ])]
}
