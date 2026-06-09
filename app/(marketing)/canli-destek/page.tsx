import { SeoLandingPage, createSeoLandingMetadata } from '@/components/marketing/seo-landing-page'
import { PAGE_SEO } from '@/lib/seo'

export const metadata = createSeoLandingMetadata(PAGE_SEO.canliDestek)

const config = {
  meta: PAGE_SEO.canliDestek,
  badge: 'Canlı Destek Yazılımı',
  h1: 'Web sitenize profesyonel canlı destek ekleyin',
  subtitle:
    'Gu Chat ile ziyaretçilerinize gerçek zamanlı yanıt verin. Canlı sohbet widget, ziyaretçi takibi, proaktif mesajlar ve AI destek — hepsi tek platformda. Türkiye\'de üretildi, KVKK uyumlu.',
  cta: { label: 'Ücretsiz Canlı Destek Başlat', href: '/register' },
  benefits: [
    { title: '30 saniyede kurulum', desc: 'Tek satır kod ile web sitenize canlı sohbet widget\'ı ekleyin. Teknik bilgi gerekmez.' },
    { title: 'Ziyaretçi takibi', desc: 'Çevrimiçi ziyaretçileri gerçek zamanlı görün, hangi sayfada olduklarını bilin, proaktif mesaj gönderin.' },
    { title: 'AI destekli yanıt', desc: 'Tekrarlayan soruları chatbot ile otomatik yanıtlayın, temsilci yükünü azaltın.' },
    { title: 'Birleşik inbox', desc: 'Widget, WhatsApp, e-posta ve Messenger — tüm kanallar tek panelde.' },
    { title: 'Proaktif mesajlar', desc: 'Doğru anda doğru mesajı gönderin. Sepet terkini azaltın, dönüşümü artırın.' },
    { title: 'Analitik & raporlar', desc: 'Yanıt süresi, memnuniyet puanı ve ekip performansını takip edin.' },
  ],
  sections: [
    {
      title: 'Canlı destek yazılımı nedir?',
      paragraphs: [
        'Canlı destek yazılımı, web sitenizi ziyaret eden müşterilerle gerçek zamanlı iletişim kurmanızı sağlayan bir araçtır. Ziyaretçiler sağ alt köşedeki sohbet widget\'ından anında mesaj gönderebilir, temsilcileriniz aynı anda yanıt verebilir.',
        'E-posta desteğinin aksine canlı destek anlık çözüm sunar. Müşteriler satın alma kararı vermeden önce sorularına cevap alır, işletmeniz dönüşüm kaybını önler.',
        'Gu Chat, Türkiye\'nin yerli canlı destek platformudur. iyzico ile güvenli ödeme, KVKK uyumu ve Türkçe arayüz ile yerel işletmelere özel tasarlanmıştır.',
      ],
    },
    {
      title: 'Kimler canlı destek kullanmalı?',
      paragraphs: [
        'E-ticaret siteleri, SaaS şirketleri, ajanslar, eğitim kurumları ve hizmet sektöründeki tüm işletmeler canlı destekten faydalanır. Özellikle yüksek değerli ürün satan veya karmaşık hizmet sunan firmalar için vazgeçilmezdir.',
        'Küçük ekipler ücretsiz paket ile başlayabilir, büyüdükçe Profesyonel veya Kurumsal pakete geçebilir. 2 temsilciden sınırsız temsilciye kadar ölçeklenir.',
      ],
    },
  ],
  faqs: [
    { q: 'Canlı destek ücretsiz mi?', a: 'Evet, Gu Chat ücretsiz paket ile 2 temsilci ve ayda 100 sohbet sunar. Kredi kartı gerekmez, 14 gün tüm özellikleri deneyebilirsiniz.' },
    { q: 'Kurulum ne kadar sürer?', a: 'Widget kodunu sitenize yapıştırmanız yeterli — 30 saniyede canlı destek aktif olur. WordPress, Shopify ve özel siteler desteklenir.' },
    { q: 'Mobil uyumlu mu?', a: 'Evet, Gu Chat widget\'ı tüm cihazlarda sorunsuz çalışır. Responsive tasarım ile mobil ziyaretçiler de kolayca mesaj gönderebilir.' },
    { q: 'WhatsApp ile birlikte kullanılabilir mi?', a: 'Evet, WhatsApp Business entegrasyonu ile WhatsApp mesajlarını aynı inbox\'ta yönetirsiniz.' },
  ],
  relatedLinks: [
    { label: 'Chatbot Yazılımı', href: '/chatbot' },
    { label: 'WhatsApp Destek', href: '/whatsapp-destek' },
    { label: 'Fiyatlandırma', href: '/pricing' },
    { label: 'Özellikler', href: '/features' },
  ],
}

export default function CanliDestekPage() {
  return <SeoLandingPage config={config} />
}
