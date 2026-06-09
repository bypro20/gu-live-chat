export type BlogPost = {
  slug: string
  title: string
  date: string
  dateIso: string
  excerpt: string
  content: string[]
  keywords: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'canli-destek-neden-onemli',
    title: 'Canlı Destek Neden Önemli? Satışları %40\'a Kadar Artırın',
    date: '15 Mayıs 2026',
    dateIso: '2026-05-15',
    excerpt: 'Canlı destek yazılımı kullanan işletmeler dönüşüm oranını nasıl artırıyor? Verilerle anlatıyoruz.',
    keywords: ['canlı destek neden önemli', 'live chat satış artışı'],
    content: [
      'Müşteriler anında yanıt bekliyor. Araştırmalar, yanıt süresinin 1 dakikadan fazla gecikmesi halinde dönüşüm oranının %40\'a kadar düştüğünü gösteriyor. Canlı destek yazılımı bu boşluğu kapatır.',
      'Canlı destek, web sitenizdeki ziyaretçilerle gerçek zamanlı iletişim kurmanızı sağlar. Sorular anında yanıtlanır, tereddüt eden müşteriler satın almaya ikna olur. Özellikle e-ticaret sitelerinde sepet terk oranı canlı sohbet ile %20\'ye kadar azalabilir.',
      'Gu Chat ile widget\'ınızı 30 saniyede kurabilir, chatbot ile tekrarlayan soruları otomatik yanıtlayabilir ve ekibinizin verimliliğini artırabilirsiniz. Ücretsiz paket ile hemen başlayın.',
      'Proaktif mesajlar da büyük fark yaratır: belirli sayfalarda bekleyen ziyaretçilere otomatik yardım teklif ederek dönüşüm fırsatlarını kaçırmazsınız.',
    ],
  },
  {
    slug: 'chatbot-kurulum-rehberi',
    title: 'Chatbot Kurulum Rehberi — 10 Dakikada Otomatik Yanıt',
    date: '8 Mayıs 2026',
    dateIso: '2026-05-08',
    excerpt: 'Gu Chat chatbot\'unuzu kod yazmadan kurun. Görsel editör, AI entegrasyonu ve test ipuçları.',
    keywords: ['chatbot kurulum', 'chatbot nasıl kurulur'],
    content: [
      'Gu Chat chatbot\'u görsel bir editör ile kurulur. Kod yazmanıza gerek yok — sürükle-bırak arayüzü ile akışlarınızı dakikalar içinde oluşturursunuz.',
      'İlk adım: Ayarlar > Chatbot bölümüne gidin ve yeni bir akış oluşturun. Karşılama mesajı, soru-cevap adımları ve temsilciye yönlendirme kurallarını tanımlayın.',
      'Bilgi bankanızı chatbot\'a bağlayarak AI destekli yanıtlar alabilirsiniz. GPT ve Gemini modelleri ile müşterilerinize doğal dilde cevap verin.',
      'Test modunda akışı deneyin, ardından yayına alın. Analitik panelden chatbot performansını takip ederek hangi soruların en çok sorulduğunu görün.',
    ],
  },
  {
    slug: 'musteri-deneyimi-ipuclari',
    title: 'Müşteri Deneyimi İpuçları — 5 Pratik Öneri',
    date: '1 Mayıs 2026',
    dateIso: '2026-05-01',
    excerpt: 'Yanıt süresini kısaltmak ve çözüm oranını artırmak için kanıtlanmış stratejiler.',
    keywords: ['müşteri deneyimi', 'müşteri memnuniyeti ipuçları'],
    content: [
      'Hızlı yanıt vermek müşteri memnuniyetinin temelidir. Ortalama yanıt sürenizi analitik panelden takip edin ve 60 saniye altında hedef belirleyin.',
      'Hazır cevaplar kullanarak sık sorulan sorulara tutarlı yanıtlar verin. Inbox\'ta "/" yazarak hazır cevaplarınıza anında erişin.',
      'Proaktif mesajlar ile ziyaretçilerinize doğru anda ulaşın. Sepet terk eden kullanıcılara yardım teklif edin veya yeni ziyaretçileri karşılayın.',
      'CSAT puanlama sistemi ile müşteri memnuniyetini ölçün. Düşük puanlı sohbetleri inceleyerek sürekli iyileştirme yapın.',
      'Tüm kanalları (WhatsApp, e-posta, widget) tek inbox\'ta birleştirerek müşteriye tutarlı deneyim sunun.',
    ],
  },
  {
    slug: 'whatsapp-ile-musteri-destegi',
    title: 'WhatsApp ile Müşteri Desteği — Nasıl Kurulur?',
    date: '20 Mayıs 2026',
    dateIso: '2026-05-20',
    excerpt: 'WhatsApp Business entegrasyonu ile müşterilerinize en sevdikleri kanaldan ulaşın.',
    keywords: ['whatsapp müşteri hizmetleri', 'whatsapp canlı destek'],
    content: [
      'Türkiye\'de milyonlarca kullanıcı WhatsApp üzerinden iletişim kurmayı tercih ediyor. İşletmenizin müşteri hizmetlerini WhatsApp\'a taşımak memnuniyeti ve erişilebilirliği artırır.',
      'Gu Chat WhatsApp Business entegrasyonu ile gelen WhatsApp mesajlarını birleşik inbox\'ta yönetirsiniz. Widget, e-posta ve diğer kanallarla aynı panelde.',
      'Chatbot akışlarını WhatsApp\'a da uygulayarak sık sorulan soruları otomatik yanıtlayın. Karmaşık talepler otomatik olarak canlı temsilciye aktarılır.',
      'Kurulum: Ayarlar > Kanallar bölümünden WhatsApp Business API bağlantınızı yapın. Eklenti mağazasından WhatsApp kanalını aktifleştirin.',
    ],
  },
  {
    slug: 'e-ticaret-canli-destek',
    title: 'E-Ticaret için Canlı Destek — Satışları Artırmanın Yolu',
    date: '18 Mayıs 2026',
    dateIso: '2026-05-18',
    excerpt: 'Online mağazanızda canlı destek ile sepet terkini azaltın, dönüşümü artırın.',
    keywords: ['e-ticaret canlı destek', 'online mağaza live chat'],
    content: [
      'E-ticaret sitelerinde ziyaretçilerin %70\'i soru sormadan ayrılır. Ürün boyutu, kargo süresi veya iade politikası hakkında net bilgi alamayan müşteri rakibe gider.',
      'Canlı destek widget\'ı ürün sayfalarında, sepette ve ödeme adımında stratejik konumlandırıldığında dönüşüm oranı %15-25 artabilir.',
      'Gu Chat proaktif mesaj özelliği ile sepette 30 saniyeden fazla bekleyen ziyaretçilere otomatik yardım teklif edin. "Yardımcı olabilir miyim?" mesajı satış kapısı açar.',
      'Ziyaretçi takibi ile hangi sayfada olduklarını görün, hangi ürüne baktıklarını bilin. Doğru anda doğru mesajı gönderin.',
    ],
  },
  {
    slug: 'live-chat-vs-email',
    title: 'Canlı Destek mi E-posta mı? Hangisi Daha Etkili?',
    date: '12 Mayıs 2026',
    dateIso: '2026-05-12',
    excerpt: 'Canlı sohbet ve e-posta desteğini karşılaştırıyoruz. İkisini birlikte nasıl kullanırsınız?',
    keywords: ['canlı destek vs email', 'live chat avantajları'],
    content: [
      'E-posta desteği hâlâ önemli — resmi talepler, fatura sorunları ve detaylı şikayetler için idealdir. Ancak ortalama e-posta yanıt süresi 12 saatin üzerindedir.',
      'Canlı destek anlık çözüm sunar. Acil sorular, satın alma kararları ve teknik destek için vazgeçilmezdir. Gu Chat her iki kanalı da tek inbox\'ta birleştirir.',
      'En iyi strateji: chatbot ile basit soruları otomatik yanıtlayın, canlı temsilci ile karmaşık talepleri çözün, e-posta ile resmi yazışmaları sürdürün.',
      'Gu Chat birleşik gelen kutusu sayesinde temsilciniz hangi kanaldan gelirse gelsin aynı arayüzden yanıt verir. Müşteri geçmişi tek ekranda.',
    ],
  },
  {
    slug: 'ziyaretci-takibi-satis',
    title: 'Ziyaretci Takibi ile Satış Artırma Rehberi',
    date: '10 Mayıs 2026',
    dateIso: '2026-05-10',
    excerpt: 'Ziyaretçilerinizi gerçek zamanlı izleyin, doğru anda müdahale edin, satışı kaçırmayın.',
    keywords: ['ziyaretci takibi', 'canlı ziyaretci izleme'],
    content: [
      'Ziyaretçi takibi, web sitenizdeki kullanıcıları gerçek zamanlı görmenizi sağlar. Hangi sayfada olduklarını, ne kadar süredir gezdiklerini ve nereden geldiklerini bilirsiniz.',
      'Gu Chat ziyaretçi paneli ile çevrimiçi ziyaretçileri listeleyin, sayfa geçmişlerini görün ve proaktif mesaj gönderin. Profesyonel pakette ekran izleme ile ziyaretçinin gördüğünü de takip edebilirsiniz.',
      'Satış ekibi için altın değerinde: fiyatlandırma sayfasında 2 dakikadan fazla kalan ziyaretçiye özel teklif mesajı gönderin.',
      'Analitik panel ile hangi sayfaların en çok destek talebi oluşturduğunu görün ve içeriği optimize edin.',
    ],
  },
  {
    slug: 'ai-musteri-hizmetleri',
    title: 'AI ile Müşteri Hizmetleri — 7/24 Otomatik Destek',
    date: '5 Mayıs 2026',
    dateIso: '2026-05-05',
    excerpt: 'Yapay zeka destekli müşteri hizmetleri ile maliyeti düşürün, memnuniyeti artırın.',
    keywords: ['AI müşteri hizmetleri', 'yapay zeka destek'],
    content: [
      'AI müşteri hizmetleri artık lüks değil, gereklilik. Tekrarlayan soruların %60-80\'i yapay zeka ile otomatik yanıtlanabilir.',
      'Gu Chat AI asistanı bilgi bankanızı okur, müşteri sorusunu anlar ve doğal dilde yanıt verir. Temsilci atanana kadar AI devrede kalır.',
      'GPT-4 ve Gemini modelleri desteklenir. Türkçe dahil 50+ dilde çeviri ile global müşterilerinize de hizmet verin.',
      'AI yanıt önerileri temsilcilere de yardımcı olur: inbox\'ta tek tıkla profesyonel yanıt önerileri alın, yanıt süresini yarıya indirin.',
    ],
  },
]

export const BLOG_BY_SLUG = Object.fromEntries(BLOG_POSTS.map((p) => [p.slug, p])) as Record<string, BlogPost>
