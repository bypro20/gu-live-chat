export const tr = {
  nav: {
    products: 'Ürünler',
    features: 'Özellikler',
    pricing: 'Fiyatlandırma',
    blog: 'Blog',
    mobile: 'Mobil',
    login: 'Giriş Yap',
    startFree: 'Ücretsiz Başla',
    language: 'Dil',
  },
  hero: {
    badge: "Türkiye'nin canlı destek platformu",
    title: 'Ziyaretçinizi müşteriye dönüştürmenin en etkili yolu',
    titleBefore: 'Ziyaretçinizi müşteriye dönüştürmenin',
    titleHighlight: 'en etkili yolu',
    subtitle: 'Canlı sohbet, AI chatbot ve WhatsApp — tek gelen kutusunda. Kurulum 30 saniye, kredi kartı gerekmez.',
    cta: 'Ücretsiz Başla',
    demo: 'Canlı Demo Gör',
    trial: '7 gün ücretsiz · Kredi kartı gerekmez · Kurulum 30 saniye',
  },
  pricing: {
    title: 'Basit, şeffaf fiyatlandırma',
    subtitle: 'Gizli ücret yok. İşletmenizin büyüklüğüne uygun paketi seçin.',
    monthly: 'Aylık',
    yearly: 'Yıllık',
    yearlyDiscount: '-20%',
    free: 'Ücretsiz',
    perMonth: '/ay',
    popular: 'Popüler',
    buyNow: 'Satın Al — Ödemeye Git',
    startFree: 'Ücretsiz Başla',
    paymentNote: 'Güvenli ödeme',
    paymentIyzico: 'iyzico ile güvenli ödeme',
    regionDetected: 'Bölgeniz',
  },
  plans: {
    FREE: { name: 'Ücretsiz', desc: 'Başlamak için ideal' },
    STARTER: { name: 'Başlangıç', desc: 'Büyüyen işletmeler' },
    PRO: { name: 'Profesyonel', desc: 'Profesyonel ekipler' },
    BUSINESS: { name: 'Kurumsal', desc: 'Büyük ölçekli çözüm' },
  },
  footer: {
    tagline: 'Profesyonel canlı destek ve chatbot platformu.',
  },
} as const

export type MessageTree = {
  nav: {
    products: string
    features: string
    pricing: string
    blog: string
    mobile: string
    login: string
    startFree: string
    language: string
  }
  hero: {
    badge: string
    title: string
    titleBefore: string
    titleHighlight: string
    subtitle: string
    cta: string
    demo: string
    trial: string
  }
  pricing: {
    title: string
    subtitle: string
    monthly: string
    yearly: string
    yearlyDiscount: string
    free: string
    perMonth: string
    popular: string
    buyNow: string
    startFree: string
    paymentNote: string
    paymentIyzico: string
    regionDetected: string
  }
  plans: {
    FREE: { name: string; desc: string }
    STARTER: { name: string; desc: string }
    PRO: { name: string; desc: string }
    BUSINESS: { name: string; desc: string }
  }
  footer: { tagline: string }
}
