/**
 * Gu Live Chat — canlı mor/pembe/camgöbeği marka paleti (myQR esinli).
 * Tek kaynak: marketing, panel, widget varsayılanları.
 * İmza gradyan: mor #A855F7 → pembe #EC4899 → camgöbeği #22D3EE.
 */
export const GU_BRAND = {
  /** Ana marka — elektrik mor */
  primary: '#9333EA',
  primaryHover: '#7E22CE',
  primaryActive: '#6B21A8',
  primaryLight: '#F3E8FF',
  primaryForeground: '#FFFFFF',
  primaryGlow: 'rgba(147, 51, 234, 0.30)',

  /** İkincil vurgu — canlı pembe */
  accent: '#EC4899',
  accentHover: '#DB2777',
  accentLight: '#FCE7F3',
  accentForeground: '#FFFFFF',

  /** Yüzeyler — lavanta beyazı */
  background: '#FAF7FF',
  foreground: '#0F0720',
  card: '#FFFFFF',
  cardForeground: '#0F0720',
  muted: '#F5F1FB',
  mutedForeground: '#5E5570',
  border: '#ECE3F6',
  borderStrong: '#DBCBEE',

  /** Koyu bölümler — mor-siyah */
  ink: '#0C0118',
  inkSoft: '#1A0A2E',

  /** Durum */
  success: '#16A34A',
  successLight: '#E7F8EE',

  /** Marketing */
  marketingHero:
    'linear-gradient(180deg, #FFFFFF 0%, #F3E8FF 48%, #FAF7FF 100%)',
  marketingHeroGrid: 'rgba(147, 51, 234, 0.06)',
  marketingHeroGlow: 'rgba(147, 51, 234, 0.12)',
  marketingDark: '#0C0118',

  /** Gölgeler — mor tonlu */
  shadowBrand: '0 8px 24px -6px rgba(147, 51, 234, 0.32)',
  shadowBrandLg: '0 12px 32px -8px rgba(147, 51, 234, 0.38)',

  /** Gradient — imza mor→pembe→camgöbeği */
  gradientText: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #22D3EE 100%)',
  gradientBrand: 'linear-gradient(165deg, #0C0118 0%, #1A0A2E 40%, #0F172A 100%)',
  gradientCta: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #22D3EE 100%)',

  /** Widget / kanal varsayılanı */
  widgetDefault: '#9333EA',

  /** Marketing CTA — canlı mor */
  marketingCta: '#9333EA',
  marketingCtaHover: '#7E22CE',
  marketingCtaForeground: '#FFFFFF',
  marketingSurface: '#F5EEFC',
  marketingSurfaceAlt: '#EFE4FA',

  /** Marketing tipografi — mor-siyah başlık + mor vurgu + camgöbeği */
  marketingHeading: '#0F0720',
  marketingBody: '#5A5168',
  marketingMuted: '#8E84A3',
  marketingLink: '#0F0720',
  marketingLinkHover: '#7E22CE',
  marketingAccentGold: '#9333EA',
  marketingAccentGoldSoft: '#7E22CE',
} as const

export type GuBrandKey = keyof typeof GU_BRAND

/** Marketing layout inline style için */
export function guBrandMarketingStyle(): Record<string, string> {
  return {
    background: GU_BRAND.background,
    color: GU_BRAND.marketingBody,
    '--foreground': GU_BRAND.marketingHeading,
    '--background': GU_BRAND.background,
    '--card': GU_BRAND.card,
    '--card-foreground': GU_BRAND.marketingHeading,
    '--muted': GU_BRAND.muted,
    '--muted-foreground': GU_BRAND.marketingMuted,
    '--border': GU_BRAND.border,
    /* Marketing: altın vurgu, yeşil metin/icon değil */
    '--primary': GU_BRAND.primary,
    '--primary-hover': GU_BRAND.primaryHover,
    '--primary-foreground': GU_BRAND.primaryForeground,
    '--primary-light': GU_BRAND.primaryLight,
    '--marketing-hero': GU_BRAND.marketingHero,
    '--marketing-accent': GU_BRAND.marketingAccentGold,
    '--marketing-navy': GU_BRAND.marketingDark,
    '--marketing-cta': GU_BRAND.marketingCta,
    '--marketing-cta-hover': GU_BRAND.marketingCtaHover,
    '--marketing-cta-foreground': GU_BRAND.marketingCtaForeground,
    '--marketing-surface': GU_BRAND.marketingSurface,
    '--premium-heading': GU_BRAND.marketingHeading,
    '--premium-body': GU_BRAND.marketingBody,
    '--premium-muted': GU_BRAND.marketingMuted,
    '--premium-gold': GU_BRAND.marketingAccentGold,
    '--premium-link': GU_BRAND.marketingLink,
    '--premium-link-hover': GU_BRAND.marketingLinkHover,
    '--shadow-brand': GU_BRAND.shadowBrand,
    '--shadow-brand-lg': GU_BRAND.shadowBrandLg,
  }
}
