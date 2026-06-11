/** iyzico başvuru ve yasal sayfalar için site bilgileri */
export const SITE_LEGAL = {
  name: 'Gu Chat',
  tagline: 'Ziyaretçinizi müşteriye dönüştürmenin en etkili yolu',
  metaDescription:
    'Gu Chat — Türkiye\'nin #1 canlı destek ve chatbot platformu. Web sitenize 30 saniyede canlı sohbet ekleyin, WhatsApp ve AI ile müşterilerinize anında ulaşın. Ücretsiz başlayın.',
  legalName: process.env.COMPANY_LEGAL_NAME || 'Gu Chat Yazılım ve Teknoloji A.Ş.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org',
  email: process.env.SUPPORT_EMAIL || 'destek@guchat.org',
  phone: process.env.SUPPORT_PHONE || '+90 850 000 00 00',
  address:
    process.env.COMPANY_ADDRESS || 'Haydar Mahallesi, Öner Sokak No: 29, İstanbul, Türkiye',
  mersis: process.env.COMPANY_MERSIS || '—',
  taxOffice: process.env.COMPANY_TAX_OFFICE || '—',
  taxNo: process.env.COMPANY_TAX_NO || '—',
  workingHours: '7/24 online destek',
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || '',
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || '',
    x: process.env.NEXT_PUBLIC_SOCIAL_X || '',
  },
} as const
