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

/** Resmi destek / iletişim e-postası (sitede gösterilir) */
export const SUPPORT_EMAIL_ADDRESS = 'destek@gulivechat.com'

/** Resend ile gönderim — domain doğrulaması olan adres */
export const NOREPLY_EMAIL_ADDRESS = 'noreply@gulivechat.com'

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || SUPPORT_EMAIL_ADDRESS
}

/** İletişim formu hedefi (görünen adres) */
export function getContactEmail(): string {
  return process.env.CONTACT_EMAIL?.trim() || getSupportEmail()
}

/** Resend/SMTP gönderici — relay hatası olmaması için noreply@ */
export function getTransactionalFrom(): string {
  const raw = process.env.EMAIL_FROM?.trim() || process.env.SMTP_FROM?.trim()
  if (raw) return raw.includes('<') ? raw : `Gu Live Chat <${raw}>`
  return `Gu Live Chat <${NOREPLY_EMAIL_ADDRESS}>`
}

/**
 * Gerçek e-posta bildirimi alacak adres (Gmail vb.).
 * @gulivechat.com adreslerine gönderim MX olmadan bounce verir — atlanır.
 */
export function getMailNotifyTo(): string | null {
  if (process.env.MAIL_DELIVER_TO_OWN_DOMAIN === 'true') {
    const own = process.env.MAIL_NOTIFY_TO?.trim() || process.env.ADMIN_EMAIL?.trim() || getSupportEmail()
    return own || null
  }

  const candidates = [
    process.env.MAIL_NOTIFY_TO?.trim(),
    process.env.ADMIN_EMAIL?.trim(),
  ].filter(Boolean) as string[]

  for (const email of candidates) {
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain === SITE_DOMAIN.toLowerCase() || domain === `www.${SITE_DOMAIN}`.toLowerCase()) {
      continue
    }
    return email
  }
  return null
}

export function getNoreplyEmail(): string {
  return process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim() || NOREPLY_EMAIL_ADDRESS
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
