import { SeoLandingPage, createSeoLandingMetadata } from '@/components/marketing/seo-landing-page'
import { PAGE_SEO } from '@/lib/seo'

export const metadata = createSeoLandingMetadata(PAGE_SEO.chatbot)

const config = {
  meta: PAGE_SEO.chatbot,
  badge: 'Chatbot Yazılımı',
  h1: '7/24 otomatik müşteri hizmetleri chatbot\'u',
  subtitle:
    'Gu Chat chatbot ile tekrarlayan soruları otomatik yanıtlayın. Görsel akış editörü, AI destekli yanıtlar ve akıllı temsilci yönlendirme. Temsilci yükünü %60\'a kadar azaltın.',
  cta: { label: 'Chatbot\'u Ücretsiz Dene', href: '/register' },
  benefits: [
    { title: 'Görsel akış editörü', desc: 'Kod yazmadan chatbot akışları oluşturun. Sürükle-bırak arayüz ile dakikalar içinde yayına alın.' },
    { title: 'AI destekli yanıt', desc: 'GPT ve Gemini ile doğal dilde yanıt. Bilgi bankanızı AI\'a öğretin.' },
    { title: 'Akıllı yönlendirme', desc: 'Karmaşık talepleri otomatik olarak canlı temsilciye aktarın.' },
    { title: 'Çok kanallı', desc: 'Widget, WhatsApp ve Messenger\'da aynı chatbot akışlarını kullanın.' },
    { title: 'SSS otomasyonu', desc: 'Sık sorulan soruları chatbot ile yanıtlayın, temsilci zamanını tasarruf edin.' },
    { title: 'Performans analizi', desc: 'Hangi soruların en çok sorulduğunu görün, chatbot\'u sürekli iyileştirin.' },
  ],
  sections: [
    {
      title: 'Müşteri hizmetleri chatbot\'u nasıl çalışır?',
      paragraphs: [
        'Chatbot, web sitenizdeki ziyaretçilerin sorularını otomatik yanıtlayan yapay zeka destekli bir asistandır. Karşılama mesajı gönderir, sık sorulan soruları yanıtlar ve gerektiğinde canlı temsilciye yönlendirir.',
        'Gu Chat chatbot\'u görsel editör ile kurulur. "Merhaba, size nasıl yardımcı olabilirim?" ile başlayan akışlar oluşturur, buton seçenekleri ve metin girişleri tanımlarsınız.',
        'Profesyonel pakette AI asistan devreye girer: bilgi bankanızdaki makaleleri okur, müşteri sorusunu anlar ve doğal dilde yanıt verir. Temsilci atanınca AI durur, insan devralır.',
      ],
    },
    {
      title: 'Chatbot ile ne kadar tasarruf edilir?',
      paragraphs: [
        'Ortalama bir müşteri hizmetleri ekibinin sorularının %60-80\'i tekrarlayan niteliktedir: kargo süresi, iade politikası, fiyat bilgisi gibi. Chatbot bu soruları 7/24 otomatik yanıtlar.',
        'Gece ve hafta sonu gelen talepler ertesi güne kalmaz — chatbot anında yanıt verir. Müşteri memnuniyeti artar, temsilci maliyeti düşer.',
      ],
    },
  ],
  faqs: [
    { q: 'Chatbot kurmak için kod bilgisi gerekir mi?', a: 'Hayır. Gu Chat görsel chatbot editörü ile sürükle-bırak arayüzde akışlar oluşturursunuz.' },
    { q: 'AI chatbot hangi dilleri destekler?', a: 'Türkçe dahil 50+ dilde AI yanıt ve canlı çeviri desteklenir.' },
    { q: 'Chatbot canlı temsilci ile birlikte çalışır mı?', a: 'Evet. Chatbot basit soruları yanıtlar, karmaşık talepler otomatik olarak canlı temsilciye aktarılır.' },
    { q: 'Ücretsiz pakette chatbot var mı?', a: 'Temel chatbot akışları Başlangıç paketinde, AI destekli chatbot Profesyonel pakette yer alır.' },
  ],
  relatedLinks: [
    { label: 'Canlı Destek', href: '/canli-destek' },
    { label: 'Yapay Zeka', href: '/ai' },
    { label: 'Blog: Chatbot Kurulum', href: '/blog/chatbot-kurulum-rehberi' },
    { label: 'Fiyatlandırma', href: '/pricing' },
  ],
}

export default function ChatbotPage() {
  return <SeoLandingPage config={config} />
}
