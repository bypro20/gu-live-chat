import type { HomeMessages } from './home-types'
import { trialFreeTierFaqLine } from '@/lib/trial-config'

export const homeTr: HomeMessages = {
  trustStrip: {
    title: 'Neden Gu Live Chat?',
    stats: [
      { value: '30 sn', label: 'Kurulum süresi' },
      { value: '7 gün', label: 'Ücretsiz PRO deneme' },
      { value: '50+', label: 'Dil desteği' },
      { value: 'KVKK', label: 'Uyumlu altyapı' },
    ],
  },
  mobileApp: {
    badge: 'Android Uygulama',
    title: 'Android uygulamamızı buradan yükleyin',
    desc: 'Evde, işte, her yerde — dışarıda bile müşterilerinizle konuşmaya devam edin. Gelen kutusu, bildirimler ve hızlı yanıt cebinizde.',
    download: 'APK İndir — Ücretsiz',
    setup: 'Kurulum adımları',
    note: 'Android 7.0+ · Gu Live Chat hesabınızla giriş yapın',
    iconAlt: 'Gu Live Chat Android uygulama ikonu',
  },
  features: {
    label: 'Özellikler',
    title: 'Her şey tek çatı altında',
    subtitle: 'Müşteri destek sürecinizi uçtan uca yönetmek için ihtiyacınız olan araçlar.',
    items: [
      { title: 'Anlık Sohbet', desc: 'Milisaniyelik mesajlaşma, yazıyor göstergesi ve dosya paylaşımı.' },
      { title: 'AI Sohbet Asistanı', desc: 'GPT/Gemini ile insan gibi yanıt — Profesyonel pakette dahil, alt paketlerde eklenti.' },
      { title: 'Birleşik Inbox', desc: 'Widget, e-posta ve mesajlaşma kanalları tek ekranda.' },
      { title: 'Canlı Çeviri', desc: '50+ dilde çift yönlü anlık çeviri — temsilci ve ziyaretçi kendi dilinde konuşur.' },
      { title: 'Ziyaretçi Takibi', desc: 'Canlı ziyaretçi listesi, sayfa geçmişi ve davranış analizi.' },
      { title: 'Bilgi Bankası', desc: 'Self-servis yardım merkezi ile destek yükünü azaltın.' },
      { title: 'Analitik', desc: 'Yanıt süreleri, çözüm oranları ve ekip performansı.' },
    ],
    cta: 'Tüm özellikleri gör',
  },
  ai: {
    label: 'AI Agent',
    title: 'Sohbetlerin büyük kısmını otomatik çözün',
    desc: 'Gu Live Chat AI Agent standart talepleri anında işler, bilgi bankasından yanıt verir ve ekibinizin çalışma saatlerinden tasarruf sağlar — yeni personel işe almadan desteği ölçeklendirin.',
    steps: [
      { title: 'Bilgi bankasını bağlayın', desc: 'Makalelerinizi yükleyin, AI bağlamı öğrensin.' },
      { title: 'Akışları tanımlayın', desc: 'Karşılama, yönlendirme ve eskalasyon kurallarını belirleyin.' },
      { title: '7/24 yanıt verin', desc: 'AI asistan gece gündüz müşterilerinize yardımcı olsun.' },
      { title: 'Temsilciye devredin', desc: 'Karmaşık talepler tek tıkla canlı temsilciye aktarılır.' },
    ],
    cta: 'AI özelliklerini keşfet',
  },
  translate: {
    label: 'Canlı Çeviri',
    title: 'Dünyanın her yerinden müşteriyle konuşun',
    desc: 'Gerçek zamanlı çift yönlü çeviri. Temsilci kendi dilinde yazar, ziyaretçi kendi dilinde okur — widget, gelen kutusu ve admin panelde aynı motor.',
    bullets: [
      '20+ dil desteği (Google + AI motor)',
      'Gelen kutusunda otomatik algılama',
      "Widget'ta tek tık çeviri",
      'PRO pakette sınırsız',
    ],
    cta: 'PRO paketini incele',
    demoStatus: 'Canlı çeviri aktif · TR ↔ EN',
    demos: [
      { lang: '🇩🇪 Almanca', msg: 'Wo ist meine Bestellung?', translated: 'Siparişim nerede?' },
      { lang: '🇬🇧 English', msg: 'I need a refund please', translated: 'İade talep ediyorum lütfen' },
      { lang: '🇫🇷 Français', msg: "Pouvez-vous m'aider?", translated: 'Bana yardım edebilir misiniz?' },
    ],
  },
  inbox: {
    label: 'Birleşik Inbox',
    title: 'Sohbetler, müşteriler ve talepler tek yerde',
    desc: 'Widget, WhatsApp, Instagram, Telegram ve e-postayı aynı gelen kutusunda yönetin. Masaüstü bildirimleriyle hiçbir isteği kaçırmayın; ziyaretçi profilleri ve geçmiş tek ekranda.',
    cta: 'Entegrasyonları incele',
    channels: ['Widget', 'E-posta', 'WhatsApp', 'Messenger', 'Instagram', 'Telegram'],
    samples: [
      { from: 'Widget', name: 'Ayşe K.', msg: 'Sipariş durumu?', time: '2dk' },
      { from: 'E-posta', name: 'Mehmet D.', msg: 'Fatura talebi', time: '14dk' },
      { from: 'WhatsApp', name: 'Zeynep A.', msg: 'İade süreci', time: '1sa' },
    ],
  },
  knowledge: {
    label: 'Bilgi Bankası',
    title: 'Müşteriler kendi kendine çözsün',
    desc: 'Makaleler, kategoriler ve arama ile self-servis destek merkezi oluşturun. Tekrarlayan soruları azaltın, ekibinize zaman kazandırın.',
    searchPlaceholder: 'Nasıl yardımcı olabiliriz?',
    articles: [
      { title: 'Kurulum rehberi', count: '3 makale' },
      { title: 'Widget ayarları', count: '3 makale' },
      { title: 'Fatura & plan', count: '3 makale' },
      { title: 'API dokümantasyonu', count: '3 makale' },
    ],
  },
  automation: {
    label: 'Otomasyon',
    title: 'Tekrarlayan işleri otomatikleştirin',
    desc: 'Workflow editörü ile tetikleyici ve aksiyon tabanlı akışlar oluşturun. Karşılama mesajları, etiketleme, yönlendirme ve webhook tetikleyicileri.',
    bullets: ['Yeni ziyaretçi karşılama', 'Mesai dışı otomatik yanıt', 'Webhook ile CRM senkronizasyonu'],
    flows: [
      { trigger: 'Yeni sohbet başladı', action: 'Karşılama mesajı gönder' },
      { trigger: 'Mesai dışı', action: 'Bilgi bankası linki paylaş' },
      { trigger: 'Etiket: acil', action: 'Temsilciye ata + Slack bildir' },
    ],
  },
  products: {
    label: 'Ürünler',
    title: 'İşletmeniz için modüler çözümler',
    buy: 'Satın Al',
    items: [
      { title: 'Sohbet Widget\'ı', desc: 'Sitenize saniyeler içinde ekleyin. Ücretsiz paketten başlayın.', href: '/urunler#paketler' },
      { title: 'Müşteri CRM', desc: 'Kişi profilleri, sohbet geçmişi ve etiketlerle ilişkileri yönetin.', href: '/features#crm' },
      { title: 'AI Motoru', desc: 'Akıllı yanıtlar, otomatik sınıflandırma ve öneri sistemi.', href: '/ai' },
      { title: 'Analitik Panel', desc: 'Gerçek zamanlı metrikler ve dışa aktarılabilir raporlar.', href: '/urunler#eklentiler' },
    ],
  },
  useCases: {
    label: 'Kullanım Alanları',
    title: 'Her ekip için Gu Live Chat',
    cases: [
      {
        id: 'support',
        label: 'Destek',
        title: 'Müşteri desteğini hızlandırın',
        desc: 'Ortalama yanıt süresini kısaltın, çözüm oranını artırın. Hazır cevaplar ve bilgi bankası ile ekibinizi güçlendirin.',
        bullets: ['Çok kanallı inbox', 'SLA takibi', 'Memnuniyet puanlaması'],
      },
      {
        id: 'sales',
        label: 'Satış',
        title: 'Ziyaretçileri müşteriye dönüştürün',
        desc: 'Proaktif mesajlar ve canlı sohbet ile satış fırsatlarını kaçırmayın. Ziyaretçi davranışına göre doğru anda müdahale edin.',
        bullets: ['Proaktif tetikleyiciler', 'Ziyaretçi profili', 'Lead yakalama'],
      },
      {
        id: 'marketing',
        label: 'Pazarlama',
        title: 'Kampanyalarla etkileşimi artırın',
        desc: 'Hedefli mesajlar, duyurular ve otomasyon akışları ile doğru kitleye ulaşın.',
        bullets: ['Kampanya yönetimi', 'Segmentasyon', 'A/B test desteği'],
      },
    ],
  },
  testimonials: {
    title: 'Müşterilerimiz ne diyor?',
    items: [
      { quote: 'Ekran izleme ve anlık müdahale sayesinde müşteri memnuniyetimiz belirgin şekilde arttı.', author: 'Can Y.', role: 'E-ticaret Yöneticisi', initials: 'CY' },
      { quote: 'Widget kurulumu saniyeler sürdü. Chatbot gelen taleplerin yarısını otomatik çözüyor.', author: 'Seda A.', role: 'Operasyon Müdürü', initials: 'SA' },
      { quote: 'Tüm kanallar tek ekranda, raporlar anlık. Profesyonel paket tam bir iş çözümü.', author: 'Burak K.', role: 'IT Müdürü', initials: 'BK' },
    ],
  },
  faq: {
    title: 'Sık sorulan sorular',
    items: [
      { q: "Gu Live Chat'i siteme eklemek ne kadar sürer?", a: 'Tek satır kodu sitenize ekleyin — 30 saniyede çalışmaya başlar. Teknik bilgi gerekmez. WordPress, Shopify ve tüm web siteleri desteklenir.' },
      { q: 'Canlı destek yazılımı ücretsiz mi?', a: `Evet, ücretsiz paket ile 2 temsilci, ayda 100 sohbet, temel widget ve e-posta bildirimleri sunulur. ${trialFreeTierFaqLine()}` },
      { q: 'WhatsApp canlı destek destekleniyor mu?', a: "Evet, Profesyonel pakette WhatsApp Business entegrasyonu ile WhatsApp mesajlarını birleşik inbox'ta yönetirsiniz." },
      { q: 'Chatbot ve AI destek var mı?', a: 'Evet, görsel chatbot editörü ve GPT/Gemini destekli AI asistan Profesyonel pakette yer alır. Tekrarlayan soruları 7/24 otomatik yanıtlayın.' },
      { q: 'Paket değiştirebilir miyim?', a: 'Evet, istediğiniz zaman yükseltme veya düşürme yapabilirsiniz. Veri kaybı olmaz, geçiş anında gerçekleşir.' },
      { q: 'Verilerim güvende mi?', a: "SSL/TLS şifreleme, KVKK uyumu ve düzenli yedekleme. %99.9 uptime garantisi. Türkiye'de barındırma seçenekleri mevcuttur." },
      { q: 'Canlı destek kaç temsilci destekler?', a: 'Ücretsiz pakette 2, Başlangıç pakette 5, Profesyonel pakette 25, Kurumsal pakette sınırsız temsilci kullanabilirsiniz.' },
      { q: 'Gu Live Chat yerli bir yazılım mı?', a: "Evet, Gu Live Chat Türkiye'de geliştirilmiş yerli bir canlı destek ve chatbot platformudur. Türkçe arayüz, iyzico ödeme ve KVKK uyumu standarttır." },
    ],
  },
  footerCta: {
    title: 'Hemen başlayın',
    desc: 'Kredi kartı gerekmeden ücretsiz deneyin. Kurulum 30 saniye sürer.',
    badges: ['KVKK uyumlu', 'Türk yapımı', '7/24 destek'],
    register: 'Ücretsiz Hesap Oluştur',
    contact: 'Bize Ulaşın',
  },
  planFeatures: {
    FREE: ['2 Temsilci', '100 Sohbet / Ay', 'Temel Widget', 'E-posta Bildirimleri'],
    STARTER: ['5 Temsilci', '1.000 Sohbet / Ay', 'Ziyaretçi Takibi', 'Bilgi Bankası & Bilet', 'Hazır Cevaplar', 'AI Sohbet (eklenti ile)'],
    PRO: ['25 Temsilci', 'Sınırsız Sohbet', 'AI Sohbet Asistanı (GPT/Gemini)', 'Chatbot Oluşturucu', '50+ Dil Çeviri', 'WhatsApp / E-posta / Messenger', 'API & Webhook', 'Analitik & Raporlar'],
    BUSINESS: ['Sınırsız Temsilci', 'Sınırsız Sohbet', 'AI Sohbet Asistanı & Chatbot', 'Özel Marka (White-label)', 'SLA Garantisi (%99.9)', '7/24 Öncelikli Destek', 'Özel Entegrasyon'],
  },
  mobilPage: {
    metaTitle: 'Mobil Uygulama İndir — Gu Live Chat Android APK',
    metaDescription:
      'Gu Live Chat Android uygulamasını indirin. Gelen kutusu, anlık bildirimler ve müşteri mesajlarına telefondan yanıt verin. Ücretsiz APK.',
    badge: 'Mobil Uygulama',
    title: 'Gu Live Chat Android',
    subtitle:
      'Müşteri mesajlarına telefondan anında yanıt verin. Gelen kutusu, bildirimler ve hızlı cevap — hepsi cebinizde.',
    versionNote: 'Sürüm {version} · Android 7.0+ · Adres çubuğu yok',
    download: 'APK İndir (Android)',
    noAccount: 'Henüz hesabınız yok mu?',
    registerLink: 'Ücretsiz kayıt olun',
    features: [
      { title: 'Gelen Kutusu', desc: 'Tüm kanallardan mesajlar tek ekranda' },
      { title: 'Anlık Bildirim', desc: 'Yeni mesaj gelince haberdar olun' },
      { title: 'Güvenli', desc: 'SSL şifreleme, aynı panel güvenliği' },
    ],
    installTitle: 'Kurulum adımları',
    installWarning:
      'Önce Chrome\'dan eklediğiniz eski kısayolu silin. Üstte web adresi görünmesinin sebebi odur — aşağıdaki APK gerçek uygulamadır, adres çubuğu yoktur.',
    steps: [
      'APK İndir butonuna basın ve dosyayı kaydedin.',
      'Telefonda Ayarlar → Güvenlik → Bilinmeyen kaynaklardan yükleme iznini açın (veya indirme sırasında onaylayın).',
      'İndirilen GuLiveChat.apk dosyasına dokunun ve Yükle deyin.',
      'Uygulamayı açın, Gu Live Chat hesabınızla giriş yapın — hazırsınız!',
    ],
    iphoneNote: 'iPhone kullanıcıları web paneli ve PWA ile Gu Live Chat\'e erişebilir.',
    webLogin: 'Web panelden giriş',
    iconAlt: 'Gu Live Chat uygulama ikonu',
  },
  mobileBar: {
    download: 'Android Uygulamayı İndir — Ücretsiz',
    tagline: 'Evde, işte, dışarıda — müşterilerinizle konuşmaya devam edin',
    navShort: 'İndir',
  },
}

export const footerTr = {
  taglineExtra: 'Canlı sohbet, AI asistan ve birleşik inbox — Türk yapımı.',
  columns: [
    {
      title: 'Ürün',
      links: [
        { label: 'Ürünler & Satın Al', href: '/urunler' },
        { label: 'Mobil Uygulama', href: '/mobil-indir' },
        { label: 'Canlı Destek', href: '/canli-destek' },
        { label: 'Chatbot', href: '/chatbot' },
        { label: 'WhatsApp Destek', href: '/whatsapp-destek' },
        { label: 'Özellikler', href: '/features' },
        { label: 'Entegrasyonlar', href: '/integrations' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'Apps & Eklentiler', href: '/apps' },
        { label: 'Yapay Zeka', href: '/ai' },
      ],
    },
    {
      title: 'Kaynaklar',
      links: [
        { label: 'Yardım Merkezi', href: '/help' },
        { label: 'Blog', href: '/blog' },
        { label: 'İletişim', href: '/contact' },
        { label: 'SSS', href: '/#faq' },
      ],
    },
    {
      title: 'Hesap',
      links: [
        { label: 'Giriş Yap', href: '/login' },
        { label: 'Kayıt Ol', href: '/register' },
        { label: 'Demo Talep Et', href: '/contact?konu=demo' },
      ],
    },
    {
      title: 'Yasal',
      links: [
        { label: 'Hakkımızda', href: '/hakkimizda' },
        { label: 'Gizlilik Sözleşmesi', href: '/gizlilik' },
        { label: 'Teslimat ve İade Şartları', href: '/teslimat-iade' },
        { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
        { label: 'Ödeme Güvenliği (SSL)', href: '/odeme-guvenligi' },
        { label: 'Kullanım Şartları', href: '/kullanim-sartlari' },
        { label: 'KVKK Aydınlatma', href: '/kvkk' },
        { label: 'Çerez Politikası', href: '/cerez-politikasi' },
      ],
    },
  ],
  badges: {
    ssl: '256-bit SSL',
    privacy: 'KVKK Uyumlu',
    madeIn: "Türkiye'de Üretildi",
    uptime: '99.9% Uptime',
  },
  iyzicoLinks: [
    { href: '/hakkimizda', label: 'Hakkımızda' },
    { href: '/urunler', label: 'Ürünler' },
    { href: '/gizlilik', label: 'Gizlilik Sözleşmesi' },
    { href: '/teslimat-iade', label: 'Teslimat ve İade Şartları' },
    { href: '/mesafeli-satis', label: 'Mesafeli Satış Sözleşmesi' },
    { href: '/odeme-guvenligi', label: 'Ödeme Güvenliği' },
  ],
}
