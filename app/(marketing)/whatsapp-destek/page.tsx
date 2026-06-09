import { SeoLandingPage, createSeoLandingMetadata } from '@/components/marketing/seo-landing-page'
import { PAGE_SEO } from '@/lib/seo'

export const metadata = createSeoLandingMetadata(PAGE_SEO.whatsappDestek)

const config = {
  meta: PAGE_SEO.whatsappDestek,
  badge: 'WhatsApp Canlı Destek',
  h1: 'WhatsApp ile müşteri hizmetlerinizi güçlendirin',
  subtitle:
    'Gu Chat WhatsApp Business entegrasyonu ile WhatsApp mesajlarını tek inbox\'ta yönetin. Canlı destek, chatbot ve ekip ataması — müşterilerinizin en sevdiği kanaldan ulaşın.',
  cta: { label: 'WhatsApp Desteği Başlat', href: '/register' },
  benefits: [
    { title: 'Tek inbox', desc: 'WhatsApp, widget, e-posta ve Messenger mesajlarını aynı panelden yönetin.' },
    { title: 'WhatsApp chatbot', desc: 'Sık sorulan soruları WhatsApp üzerinden otomatik yanıtlayın.' },
    { title: 'Ekip ataması', desc: 'Gelen WhatsApp mesajlarını doğru temsilciye otomatik yönlendirin.' },
    { title: 'Mesaj geçmişi', desc: 'Tüm WhatsApp konuşma geçmişi müşteri profilinde saklanır.' },
    { title: 'Hazır cevaplar', desc: 'Sık kullanılan yanıtları hazır cevap olarak kaydedin, hızlı gönderin.' },
    { title: 'Bildirimler', desc: 'Yeni WhatsApp mesajı geldiğinde anında bildirim alın, hızlı yanıt verin.' },
  ],
  sections: [
    {
      title: 'Neden WhatsApp müşteri hizmetleri?',
      paragraphs: [
        'Türkiye\'de WhatsApp en çok kullanılan mesajlaşma uygulamasıdır. Müşterileriniz zaten WhatsApp\'ta — destek kanalınızı da oraya taşıyın.',
        'WhatsApp Business API ile profesyonel müşteri hizmetleri sunarsınız. Otomatik karşılama mesajları, chatbot akışları ve canlı temsilci desteği tek platformda.',
        'Gu Chat, WhatsApp mesajlarını widget ve e-posta ile aynı inbox\'ta birleştirir. Temsilciniz hangi kanaldan gelirse gelsin aynı arayüzden yanıt verir.',
      ],
    },
    {
      title: 'WhatsApp destek nasıl kurulur?',
      paragraphs: [
        'Gu Chat hesabınızda Ayarlar > Kanallar bölümüne gidin. WhatsApp Business API bağlantınızı yapın ve eklenti mağazasından WhatsApp kanalını aktifleştirin.',
        'Chatbot akışlarınızı WhatsApp\'a da uygulayın. Karşılama mesajı, menü seçenekleri ve temsilci yönlendirme kurallarını tanımlayın.',
        'Profesyonel paket WhatsApp entegrasyonunu içerir. Kurumsal pakette öncelikli destek ve SLA garantisi sunulur.',
      ],
    },
  ],
  faqs: [
    { q: 'WhatsApp Business hesabı gerekir mi?', a: 'Evet, WhatsApp Business API entegrasyonu için doğrulanmış WhatsApp Business hesabı gereklidir.' },
    { q: 'WhatsApp mesajları inbox\'ta görünür mü?', a: 'Evet, tüm WhatsApp mesajları birleşik gelen kutusunda widget ve e-posta ile birlikte görünür.' },
    { q: 'Chatbot WhatsApp\'ta çalışır mı?', a: 'Evet, oluşturduğunuz chatbot akışları WhatsApp kanalında da otomatik yanıt verir.' },
    { q: 'Hangi pakette WhatsApp var?', a: 'WhatsApp entegrasyonu Profesyonel pakette ve eklenti mağazasından aktifleştirilebilir.' },
  ],
  relatedLinks: [
    { label: 'Canlı Destek', href: '/canli-destek' },
    { label: 'Entegrasyonlar', href: '/integrations' },
    { label: 'Blog: WhatsApp Desteği', href: '/blog/whatsapp-ile-musteri-destegi' },
    { label: 'Fiyatlandırma', href: '/pricing' },
  ],
}

export default function WhatsappDestekPage() {
  return <SeoLandingPage config={config} />
}
