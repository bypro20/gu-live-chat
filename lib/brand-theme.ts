/**
 * Gu Live Chat — özgün premium marka paleti (Gu Meridian).
 * Tek kaynak: marketing, panel, widget varsayılanları.
 */
export const GU_BRAND = {
  /** Ana marka — derin jade (mavi/mor SaaS klişesi değil) */
  primary: '#146356',
  primaryHover: '#0F5247',
  primaryActive: '#0A4038',
  primaryLight: '#E6F2EF',
  primaryForeground: '#FFFFFF',
  primaryGlow: 'rgba(20, 99, 86, 0.22)',

  /** İkincil vurgu — sıcak altın (premium, TR güven hissi) */
  accent: '#C9922E',
  accentHover: '#A87620',
  accentLight: '#FBF5E8',
  accentForeground: '#1A1814',

  /** Yüzeyler — sıcak nötr (soğuk slate değil) */
  background: '#FAF9F7',
  foreground: '#1A1814',
  card: '#FFFFFF',
  cardForeground: '#1A1814',
  muted: '#F3F1ED',
  mutedForeground: '#6B6560',
  border: '#E8E4DE',
  borderStrong: '#D4CFC6',

  /** Koyu bölümler */
  ink: '#141210',
  inkSoft: '#2A2724',

  /** Durum */
  success: '#2D9B83',
  successLight: '#E8F7F3',

  /** Marketing */
  marketingHero:
    'linear-gradient(180deg, #FFFFFF 0%, #EDF5F3 48%, #FAF9F7 100%)',
  marketingHeroGrid: 'rgba(20, 99, 86, 0.06)',
  marketingHeroGlow: 'rgba(20, 99, 86, 0.12)',
  marketingDark: '#141210',

  /** Gölgeler — jade tonlu, mavi değil */
  shadowBrand: '0 8px 24px -6px rgba(20, 99, 86, 0.28)',
  shadowBrandLg: '0 12px 32px -8px rgba(20, 99, 86, 0.32)',

  /** Gradient metin */
  gradientText: 'linear-gradient(135deg, #146356 0%, #2D9B83 42%, #C9922E 100%)',
  gradientBrand: 'linear-gradient(135deg, #146356 0%, #0F5247 55%, #141210 100%)',
  gradientCta: 'linear-gradient(135deg, #146356 0%, #0F5247 48%, #141210 100%)',

  /** Widget / kanal varsayılanı */
  widgetDefault: '#146356',

  /** Marketing CTA — butonlar yeşil değil, koyu mürekkep */
  marketingCta: '#121110',
  marketingCtaHover: '#2A2724',
  marketingCtaForeground: '#FFFFFF',
  marketingSurface: '#F4F1EC',
  marketingSurfaceAlt: '#EDEAE4',
} as const

export type GuBrandKey = keyof typeof GU_BRAND

/** Marketing layout inline style için */
export function guBrandMarketingStyle(): Record<string, string> {
  return {
    background: GU_BRAND.background,
    color: GU_BRAND.foreground,
    '--foreground': GU_BRAND.foreground,
    '--background': GU_BRAND.background,
    '--card': GU_BRAND.card,
    '--card-foreground': GU_BRAND.cardForeground,
    '--muted': GU_BRAND.muted,
    '--muted-foreground': GU_BRAND.mutedForeground,
    '--border': GU_BRAND.border,
    '--primary': GU_BRAND.primary,
    '--primary-hover': GU_BRAND.primaryHover,
    '--primary-foreground': GU_BRAND.primaryForeground,
    '--primary-light': GU_BRAND.primaryLight,
    '--marketing-hero': GU_BRAND.marketingHero,
    '--marketing-accent': GU_BRAND.accent,
    '--marketing-navy': GU_BRAND.marketingDark,
    '--marketing-cta': GU_BRAND.marketingCta,
    '--marketing-cta-hover': GU_BRAND.marketingCtaHover,
    '--marketing-cta-foreground': GU_BRAND.marketingCtaForeground,
    '--marketing-surface': GU_BRAND.marketingSurface,
    '--premium-heading': '#0A1018',
    '--premium-body': '#5C6570',
    '--premium-accent': '#00C9E0',
    '--shadow-brand': GU_BRAND.shadowBrand,
    '--shadow-brand-lg': GU_BRAND.shadowBrandLg,
  }
}
