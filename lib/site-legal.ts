import { getSiteUrl, getSupportEmail } from './site-config'

/** iyzico başvuru ve yasal sayfalar için site bilgileri */
export const SITE_LEGAL = {
  name: 'Gu Live Chat',
  tagline: 'Canlı Destek, Live Chat & AI Chatbot Platformu',
  metaDescription:
    'Gu Live Chat (gulivechat.com) — Türkiye\'nin canlı destek ve chatbot platformu. Web sitenize 30 saniyede canlı sohbet ekleyin, WhatsApp ve AI ile müşterilerinize anında ulaşın. KVKK uyumlu, iyzico güvenli ödeme.',
  legalName: process.env.COMPANY_LEGAL_NAME || 'Uğur Öncan',
  url: getSiteUrl(),
  email: getSupportEmail(),
  phone: process.env.SUPPORT_PHONE || '0505 123 68 24',
  address:
    process.env.COMPANY_ADDRESS || 'Haydar Mahallesi, Öner Sokak No: 29, Denizli, Türkiye',
  contactName: process.env.COMPANY_CONTACT_NAME || 'Uğur Öncan',
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
