'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageCircle, Bot, Users, BarChart3, Blocks, Workflow, Store,
  Check, ArrowRight, Star, Zap, Plus, Minus, ChevronDown,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { HeroPreview } from '@/components/marketing/hero-preview'
import { FadeIn } from '@/components/marketing/fade-in'

const features = [
  { icon: MessageCircle, title: 'Gerçek Zamanlı Sohbet', desc: 'Milisaniyelik mesajlaşma, yazıyor göstergesi, okundu onayı ve dosya paylaşımı.' },
  { icon: Bot, title: 'AI Chatbot', desc: 'Sık sorulan sorulara otomatik yanıt, gerektiğinde temsilciye sorunsuz aktarım.' },
  { icon: Users, title: 'Ziyaretçi Takibi', desc: 'Ziyaretçilerinizi gerçek zamanlı izleyin, sayfa geçmişi ve davranış analizi.' },
  { icon: Blocks, title: 'Çoklu Kanal', desc: 'Web, e-posta ve mesajlaşma kanallarını tek panelden yönetin.' },
  { icon: Workflow, title: 'Otomasyon', desc: 'Görsel workflow editörü ile tetikleyici ve aksiyon tabanlı akışlar oluşturun.' },
  { icon: BarChart3, title: 'Analitik', desc: 'Yanıt süreleri, sohbet hacmi, çözüm oranları ve ekip performansı raporları.' },
  { icon: Store, title: 'Eklenti Mağazası', desc: 'WhatsApp, AI asistan, beyaz etiket ve daha fazlası — ihtiyacınıza göre genişletin.' },
]

const plans = [
  { name: 'Ücretsiz', monthly: 0, desc: 'Başlamak için ideal', features: ['2 Temsilci', '100 Sohbet / Ay', 'Temel Widget', 'E-posta Bildirimleri'], highlighted: false, cta: 'Ücretsiz Başla' },
  { name: 'Başlangıç', monthly: 199, desc: 'Büyüyen işletmeler', features: ['5 Temsilci', '1.000 Sohbet / Ay', 'Chatbot', 'Ziyaretçi Takibi', 'Hazır Cevaplar'], highlighted: false, cta: 'Hemen Başla' },
  { name: 'Profesyonel', monthly: 499, desc: 'Profesyonel ekipler', features: ['15 Temsilci', 'Sınırsız Sohbet', 'AI Yardım', 'API & Webhook', 'Gelişmiş Analitik'], highlighted: true, cta: 'Hemen Başla' },
  { name: 'Kurumsal', monthly: 999, desc: 'Büyük ölçek', features: ['Sınırsız Temsilci', 'Beyaz Etiket', 'SLA Garantisi', 'Özel Entegrasyonlar', 'Öncelikli Destek'], highlighted: false, cta: 'İletişime Geç' },
]

const addons = [
  { title: 'WhatsApp Kanalı', desc: 'WhatsApp Business API ile tek panelden yanıt verin.', price: '₺149/ay' },
  { title: 'AI Asistan Pro', desc: 'Bağlama göre yanıt veren akıllı asistan.', price: '₺299/ay', popular: true },
  { title: 'Beyaz Etiket', desc: 'Kendi markanız, alan adınız ve renkleriniz.', price: '₺199/ay' },
  { title: 'Gelişmiş Analitik', desc: 'Detaylı raporlar ve özel dashboard.', price: '₺79/ay' },
]

const testimonials = [
  { quote: 'Ekran izleme ve anlık müdahale sayesinde müşteri memnuniyetimiz belirgin şekilde arttı.', author: 'Can Y.', role: 'CEO, ModaVip' },
  { quote: 'Widget kurulumu saniyeler sürdü. Chatbot gelen taleplerin yarısını otomatik çözüyor.', author: 'Seda A.', role: 'Operasyon Müdürü' },
  { quote: 'Tüm kanallar tek ekranda, raporlar anlık. Profesyonel paket tam bir iş çözümü.', author: 'Burak K.', role: 'IT Müdürü' },
]

const faqs = [
  { q: 'Gu Chat\'i siteme eklemek ne kadar sürer?', a: 'Tek satır kodu sitenize ekleyin — 30 saniyede çalışmaya başlar. Teknik bilgi gerekmez.' },
  { q: 'Ücretsiz pakette neler var?', a: '2 temsilci, ayda 100 sohbet, temel widget ve e-posta bildirimleri. Kredi kartı gerekmez.' },
  { q: 'Paket değiştirebilir miyim?', a: 'Evet, istediğiniz zaman yükseltme veya düşürme yapabilirsiniz. Veri kaybı olmaz.' },
  { q: 'Verilerim güvende mi?', a: 'SSL/TLS şifreleme, KVKK uyumu ve düzenli yedekleme. %99.9 uptime garantisi.' },
  { q: 'Mevcut platformdan geçiş yapabilir miyim?', a: 'Evet, sohbet geçmişi ve kişi bilgilerinizi taşıma aracımız mevcuttur.' },
]

const trustedBrands = ['TrendyShop', 'TeknoSoft', 'ModaVip', 'Evinİçin', 'BoostAI', 'HızlıMarket']

function PricingCard({ plan, billing, discount, idx }: {
  plan: typeof plans[0]; billing: 'monthly' | 'yearly'; discount: number; idx: number
}) {
  const price = billing === 'yearly' && plan.monthly > 0
    ? Math.round(plan.monthly * (1 - discount))
    : plan.monthly

  return (
    <FadeIn delay={idx * 0.06} className="h-full">
      <div className={`h-full surface p-6 flex flex-col ${plan.highlighted ? 'border-primary shadow-brand ring-1 ring-primary/20' : ''}`}>
        {plan.highlighted && (
          <span className="self-start mb-3 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
            Popüler
          </span>
        )}
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
        <div className="mt-5 mb-6">
          {plan.monthly === 0 ? (
            <span className="text-3xl font-bold">Ücretsiz</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">₺{price}</span>
              <span className="text-sm text-muted-foreground">/ay</span>
            </div>
          )}
        </div>
        <Link href={plan.name === 'Kurumsal' ? '/contact' : '/register'}
          className={`text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
          }`}>
          {plan.cta}
        </Link>
        <ul className="space-y-2.5 mt-6 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />{f}
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  )
}

export default function HomePage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID
    if (!websiteId) return

    const w = window as Window & {
      GU_WIDGET_URL?: string
      $gu?: { q?: unknown[][] } & ((...args: unknown[]) => void)
    }
    w.GU_WIDGET_URL = window.location.origin
    w.$gu = w.$gu || function (...args: unknown[]) {
      (w.$gu!.q = w.$gu!.q || []).push(args)
    }
    w.$gu('set', 'WEBSITE_ID', websiteId)

    if (document.querySelector('script[data-gu-widget]')) return
    const script = document.createElement('script')
    script.src = '/widget.js'
    script.async = true
    script.setAttribute('data-gu-widget', '1')
    document.body.appendChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-success rounded-full" />
              Türk yapımı canlı destek platformu
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] text-foreground">
              Müşterilerinizle{' '}
              <span className="text-primary">anında</span>{' '}
              bağlantı kurun
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Gu Chat ile web sitenize profesyonel canlı destek ekleyin.
              Gerçek zamanlı mesajlaşma, chatbot ve ziyaretçi takibi — tek platformda.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="btn-primary px-7 py-3 text-base">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary px-7 py-3 text-base">
                Özellikleri İncele <ChevronDown className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span><strong className="text-foreground font-semibold">10K+</strong> kullanıcı</span>
              <span className="w-px h-4 bg-border" />
              <span><strong className="text-foreground font-semibold">99.9%</strong> uptime</span>
              <span className="w-px h-4 bg-border" />
              <span><strong className="text-foreground font-semibold">30 sn</strong> kurulum</span>
            </div>
          </div>

          <FadeIn delay={0.15} className="mt-16">
            <HeroPreview />
          </FadeIn>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            Güvenen işletmeler
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {trustedBrands.map((name) => (
              <span key={name} className="text-base font-semibold text-muted-foreground/60 select-none">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="section-label mb-4">Özellikler</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">İhtiyacınız olan her şey</h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Müşteri destek sürecinizi hızlandıracak güçlü araçlar, tek platformda.
              </p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.04}>
                <div className="surface-hover p-5 h-full">
                  <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features" className="text-sm font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1">
              Tüm özellikleri gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight">3 adımda başlayın</h2>
              <p className="mt-3 text-muted-foreground">Dakikalar içinde canlı desteği sitenize ekleyin.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Hesap oluşturun', desc: 'Ücretsiz kayıt olun. Kredi kartı gerekmez.' },
              { step: '02', title: 'Widget\'ı özelleştirin', desc: 'Renk, pozisyon ve mesajları markanıza uyarlayın.' },
              { step: '03', title: 'Sitenize ekleyin', desc: 'Tek satır kod — anında müşterilerinizle sohbet edin.' },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary/20 mb-3">{item.step}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Addons */}
      <section id="addons" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="section-label mb-4">Eklentiler</span>
              <h2 className="text-3xl font-bold tracking-tight mt-4">İhtiyacınıza göre genişletin</h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {addons.map((a, i) => (
              <FadeIn key={a.title} delay={i * 0.06}>
                <div className="surface p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    {a.popular && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">Popüler</span>}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{a.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="font-bold">{a.price}</span>
                    <Link href="/register" className="text-xs font-semibold text-primary hover:text-primary-hover">Ekle →</Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="section-label mb-4">Fiyatlandırma</span>
              <h2 className="text-3xl font-bold tracking-tight mt-4">Basit, şeffaf fiyatlandırma</h2>
              <p className="mt-3 text-muted-foreground">İşletmenizin büyüklüğüne uygun paketi seçin.</p>
            </div>
          </FadeIn>

          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Aylık</span>
            <button
              onClick={() => setBilling((b) => b === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-border'}`}
              aria-label="Fatura dönemi"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yıllık
              <span className="ml-1.5 text-[10px] font-bold text-success bg-success-light px-1.5 py-0.5 rounded-full">-20%</span>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {plans.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} billing={billing} discount={0.2} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Müşterilerimiz ne diyor?</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.08}>
                <div className="surface p-6 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Sık sorulan sorular</h2>
            </div>
          </FadeIn>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="surface overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-medium text-sm pr-4">{faq.q}</span>
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${openFaq === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      {openFaq === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Daha fazla soru için <Link href="/help" className="text-primary hover:underline">Yardım Merkezi</Link>&apos;ni ziyaret edin.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="rounded-2xl bg-gradient-brand px-8 py-14 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Hemen başlayın</h2>
              <p className="mt-3 text-white/80 max-w-md mx-auto">
                Kredi kartı gerekmeden ücretsiz deneyin. İlk 100 sohbet tamamen ücretsiz.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2">
                  Ücretsiz Hesap Oluştur <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                  Bize Ulaşın
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
