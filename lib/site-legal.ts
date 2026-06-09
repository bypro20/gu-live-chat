/** iyzico başvuru ve yasal sayfalar için site bilgileri */
export const SITE_LEGAL = {
  name: 'Gu Chat',
  tagline: 'Ziyaretçinizi müşteriye dönüştürmenin en etkili yolu',
  metaDescription:
    'Canlı sohbet, ziyaretçi takibi ve AI ile ziyaretçinizi müşteriye dönüştürün. Widget, WhatsApp ve e-posta — tek inbox\'ta, Türk yapımı.',
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
} as const
