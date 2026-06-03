'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{id: number; text: string; sender: 'bot' | 'user'}>>([])
  const [chatInput, setChatInput] = useState('')

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    const userMsg = { id: Date.now(), text: chatInput, sender: 'user' as const }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: Date.now() + 1, text: 'Merhaba! Size yardımcı olmak için buradayım. 😊 Ücretsiz denemek için yukarıdaki butona tıklayabilirsiniz!', sender: 'bot' as const }])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-[#E5E0F0] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Gu Live Chat</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition">Özellikler</a>
              <a href="#pricing" className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition">Fiyatlandırma</a>
              <a href="#how-it-works" className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition">Nasıl Çalışır?</a>
              <a href="#faq" className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition">SSS</a>
              <Link href="/login" className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition">Giriş Yap</Link>
              <Link href="/register" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition">Ücretsiz Başla</Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4A2080] dark:text-gray-300 hover:text-primary"
              aria-label="Menü"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-[#E5E0F0] dark:border-gray-800">
              <div className="flex flex-col gap-3 pt-4">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition py-2">Özellikler</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition py-2">Fiyatlandırma</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition py-2">Nasıl Çalışır?</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition py-2">SSS</a>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#4A2080] dark:text-gray-300 hover:text-primary transition py-2">Giriş Yap</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition text-center">Ücretsiz Başla</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Türk yapımı canlı destek sistemi
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            Müşterilerinizle
            <span className="text-primary"> anında </span>
            bağlantı kurun
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Gu Live Chat ile web sitenize profesyonel canlı destek ekleyin. Gerçek zamanlı mesajlaşma, ziyaretçi takibi, chatbot ve daha fazlası.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-lg transition shadow-lg shadow-primary/25">
              Ücretsiz Başla
            </Link>
            <a href="#features" className="px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl text-lg transition">
              Özellikleri Keşfet
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aktif Kullanıcı</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">99.9%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{"< 2 dk"}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kurulum Süresi</div>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent z-10 pointer-events-none" style={{ bottom: '0', top: '70%' }}></div>
            <div className="bg-[#F5F3FF] dark:bg-gray-900 rounded-2xl border border-[#E5E0F0] dark:border-gray-700 shadow-2xl overflow-hidden">
              <div className="bg-primary p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Destek Ekibi</p>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Çevrimiçi • Tipik yanıt: 2 dk
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4 min-h-[300px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-xs shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">Merhaba! Size nasıl yardımcı olabiliriz? 😊</p>
                    <span className="text-xs text-gray-400 mt-1 block">Şimdi</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-primary text-white rounded-2xl rounded-tr-none p-4 max-w-xs shadow-sm">
                    <p className="text-sm">Merhaba, ürün iadesi yapmak istiyorum. Nasıl yapabilirim?</p>
                    <span className="text-xs text-white/70 mt-1 block">Şimdi</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-xs shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">Tabii ki! İade sürecinizi başlatmanıza yardımcı olayım. Sipariş numaranızı paylaşır mısınız?</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F3FF] dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              3 Adımda Başlayın
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Dakikalar içinde canlı desteği sitenize ekleyin
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard step="1" title="Hesap Oluşturun" description="Ücretsiz kayıt olun ve dashboardunuza erişin. Kredi kartı gerekmez." icon="🚀" />
            <StepCard step="2" title="Widget'ı Özelleştirin" description="Renk, pozisyon ve mesajlarınızı ayarlayın. 2 dakikada kurulum tamamlansın." icon="🎨" />
            <StepCard step="3" title="Sitenize Ekleyin" description="Bir satır kod kopyalayın ve yapıştırın. Anında müşterilerinizle sohbet edin!" icon="💬" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              İhtiyacınız olan her şey
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Müşteri destek sürecinizi hızlandıracak güçlü özellikler
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon="💬" title="Gerçek Zamanlı Sohbet" description="Milisaniyelik mesajlaşma ile müşterilerinize anında yanıt verin. Yazıyor göstergesi, okundu onayı ve dosya paylaşımı." />
            <FeatureCard icon="🤖" title="Akıllı Chatbot" description="Otomatik yanıt akışları oluşturun. Sık sorulan sorulara otomatik cevap verin ve gerektiğinde temsilciye aktarın." />
            <FeatureCard icon="👥" title="Takım Yönetimi" description="Temsilci ekleyin, roller atayın ve sohbetleri dağıtın. Yuvarlak robin veya manuel atama desteği." />
            <FeatureCard icon="📊" title="Ziyaretçi Takibi" description="Hangi sayfalarda geziniyorlar, nereden geliyorlar ve ne kadar süre kalıyorlar? Tam görünür." />
            <FeatureCard icon="⚡" title="Hazır Cevaplar" description="Sık tekrar eden sorulara tek tuşla yanıt verin. Slash komutları ile hızlı erişim." />
            <FeatureCard icon="🔗" title="Webhook & API" description="CRM'inizle entegre edin, Slack bildirimleri alın veya özel işlemler oluşturun." />
            <FeatureCard icon="🏷️" title="Etiketler & Notlar" description="Sohbetleri kategorize edin ve iç notlar ekleyin. Takım içinde bilgi paylaşımı kolaylaşsın." />
            <FeatureCard icon="🎨" title="Özelleştirilebilir Widget" description="Renk, pozisyon, hoş geldin mesajı ve avatar gibi tüm detayları markanıza uygun ayarlayın." />
            <FeatureCard icon="📈" title="Detaylı Analitik" description="Yanıt süreleri, sohbet hacmi, çözüm oranları ve daha fazlası ile performansı ölçün." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F3FF] dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Basit, şeffaf fiyatlandırma
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              İşletmenizin büyüklüğüne uygun paketi seçin
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard name="Ücretsiz" price="₺0" period="/ay" description="Küçük işletmeler için" features={['2 temsilci', '100 sohbet/ay', 'Temel widget', 'E-posta bildirimleri']} highlighted={false} />
            <PricingCard name="Başlangıç" price="₺199" period="/ay" description="Büyüyen işletmeler" features={['5 temsilci', '1.000 sohbet/ay', 'Ziyaretçi takibi', 'Chatbot', 'Hazır cevaplar', 'Dosya yükleme']} highlighted={false} />
            <PricingCard name="Profesyonel" price="₺499" period="/ay" description="Profesyonel ekipler" features={['15 temsilci', 'Sınırsız sohbet', 'Ekran İzleme', 'AI destekli yardım', 'API erişimi', 'Webhook desteği', 'Öncelikli destek']} highlighted={true} />
            <PricingCard name="İş" price="₺999" period="/ay" description="Kurumsal çözümler" features={['Sınırsız temsilci', 'Sınırsız sohbet', 'Ekran İzleme', 'AI destekli yardım', 'Özel marka', 'SLA garantisi', 'Özel destek', 'Tüm özellikler']} highlighted={false} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Sık Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-4">
            <FAQItem question="Gu Live Chat'i siteme eklemek ne kadar sürer?" answer="Sadece 2 dakika! Bir satır kodu sitenize ekleyin ve anında çalışmaya başlasın. Teknik bilgi gerektirmez." />
            <FAQItem question="Ücretsiz pakette neler var?" answer="2 temsilci, ayda 100 sohbet, temel widget özelleştirmesi ve e-posta bildirimleri. Kredi kartı gerekmeden başlayın." />
            <FAQItem question="Daha fazla pakete geçebilir miyim?" answer="Evet! İstediğiniz zaman paket yükseltebilir veya düşürebilirsiniz. Fark ücreti prorate edilir." />
            <FAQItem question="Verilerim güvende mi?" answer="Tüm veriler SSL ile şifrelenir. Sunucularımız Avrupa'da bulunur ve KVKK uyumlu çalışıyoruz." />
            <FAQItem question="Chatbot nasıl çalışıyor?" answer="Görsel editör ile adımlar oluşturun: mesaj, seçenek, e-posta toplama ve temsilciye aktarma. Kod yazmanıza gerek yok." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Hemen başlayın, 2 dakikada kurun
          </h2>
          <p className="mt-4 text-xl text-white/80">
            Kredi kartı gerekmeden ücretsiz deneyin. İlk 100 sohbet tamamen ücretsiz.
          </p>
          <div className="mt-8">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-semibold rounded-xl text-lg hover:bg-gray-100 transition shadow-lg">
              Ücretsiz Hesap Oluştur
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E5E0F0] dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Ürün</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Özellikler</a>
                <a href="#pricing" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Fiyatlandırma</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Entegrasyonlar</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Changelog</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Destek</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Dokümantasyon</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">API Referansı</a>
                <a href="#faq" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">SSS</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">İletişim</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Şirket</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Hakkımızda</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Blog</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Kariyer</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Yasal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Gizlilik Politikası</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">Kullanım Şartları</a>
                <a href="#" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">KVKK</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#E5E0F0] dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">© 2024 Gu Live Chat. Tüm hakları saklıdır.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-[380px] h-[520px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-[#E5E0F0] dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-primary p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Gu Live Chat</p>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Çevrimiçi
                  </p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F3FF] dark:bg-gray-900">
              {chatMessages.length === 0 && (
                <div className="flex gap-2 items-start">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 shadow-sm border border-[#E5E0F0] dark:border-gray-700 max-w-[260px]">
                    <p className="text-sm text-gray-900 dark:text-white">Merhaba! 👋 Gu Live Chat destek ekibi burada. Size nasıl yardımcı olabiliriz?</p>
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className={`rounded-xl p-3 max-w-[260px] text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none shadow-sm border border-[#E5E0F0] dark:border-gray-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-[#E5E0F0] dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2.5 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-16 h-16 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-105"
        >
          {chatOpen ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E5E0F0] dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition hover:shadow-lg">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, period, description, features, highlighted }: {
  name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean
}) {
  return (
    <div className={`rounded-2xl p-6 border-2 transition ${
      highlighted
        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-[#E5E0F0] dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {highlighted && (
        <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full mb-4">
          En Popüler
        </span>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      <div className="mt-4 mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
        <span className="text-gray-500 dark:text-gray-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`block text-center py-3 rounded-xl font-semibold transition ${
          highlighted
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-[#F5F3FF] dark:bg-gray-700 text-[#0F0F1A] dark:text-white hover:bg-[#EDE9FE] dark:hover:bg-gray-600'
        }`}
      >
        Başla
      </Link>
    </div>
  )
}

function StepCard({ step, title, description, icon }: { step: string; title: string; description: string; icon: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
        {icon}
      </div>
      <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold mb-3">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#E5E0F0] dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F5F3FF] dark:hover:bg-gray-800 transition"
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        <svg className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
          {answer}
        </div>
      )}
    </div>
  )
}