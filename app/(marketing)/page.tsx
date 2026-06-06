'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  MessageCircle, Bot, Users, BarChart3, Blocks,
  Workflow, Store, ChevronDown, Check, ArrowRight, Star,
  Menu, X, MessageSquare, Send, Phone, Monitor,
  Shield, Copyright, Sparkles, Globe, Infinity,
  Zap, Mail,
  ChevronRight, Plus, Minus,
} from 'lucide-react'
import { Logo } from '@/components/marketing/logo'

const featureData = [
  { icon: MessageCircle, title: 'Gerçek Zamanlı Sohbet', desc: 'Milisaniyelik mesajlaşma ile müşterilerinize anında yanıt verin. Yazıyor göstergesi, okundu onayı ve dosya paylaşımı.' },
  { icon: Bot, title: 'AI Chatbot & Otomasyon', desc: 'Yapay zeka destekli chatbot ile sık sorulan sorulara otomatik yanıt verin, gerektiğinde temsilciye aktarın.' },
  { icon: Monitor, title: 'Ziyaretçi İzleme & Ekran Paylaşımı', desc: 'Ziyaretçilerinizi gerçek zamanlı izleyin, WebRTC ile ekran paylaşımı yaparak sorunları görerek çözün.' },
  { icon: Blocks, title: 'Çoklu Kanal Desteği', desc: 'Web, mobil, WhatsApp ve e-posta kanallarını tek bir panelden yönetin. Tüm müşterileriniz bir arada.' },
  { icon: Users, title: 'Bilgi Bankası & Bilet Sistemi', desc: 'Kendi bilgi bankanızı oluşturun, gelen talepleri bilet sistemine dönüştürerek takip edin.' },
  { icon: Workflow, title: 'Akıllı Otomasyon', desc: 'Görsel workflow editörü ile otomatik yanıt akışları oluşturun. Tetikleyiciler ve aksiyonlarla süreçleri otomatize edin.' },
  { icon: BarChart3, title: 'Gelişmiş Analitik', desc: 'Yanıt süreleri, sohbet hacmi, çözüm oranları ve ekip performansını detaylı raporlarla ölçün.' },
  { icon: Store, title: 'Eklenti Mağazası', desc: 'WhatsApp entegrasyonu, AI asistan, beyaz etiket ve daha fazlası. İhtiyacınız olan her şey tek tıkla.' },
]

const addonData = [
  { title: 'WhatsApp Kanalı', desc: 'WhatsApp Business API ile müşterilerinize WhatsApp üzerinden yanıt verin. Tek panelden tüm konuşmalar.', price: '₺149/ay', popular: false },
  { title: 'AI Asistan Pro', desc: 'GPT-4 destekli akıllı asistan. Müşteri taleplerini anlar, bağlama göre yanıt verir ve öğrenir.', price: '₺299/ay', popular: true },
  { title: 'Beyaz Etiket', desc: 'Kendi markanızla kullanın. Özel alan adı, logo, renkler ve tam marka deneyimi.', price: '₺199/ay', popular: false },
  { title: 'Gelişmiş Analitik', desc: 'Detaylı raporlar, müşteri segmentasyonu, davranış analizi ve özel dashboard.', price: '₺79/ay', popular: false },
]

const plans = [
  { name: 'Ücretsiz', desc: 'Küçük işletmeler için ideal başlangıç', monthly: 0, features: ['2 Temsilci', '100 Sohbet / Ay', 'Temel Widget', 'E-posta Bildirimleri', 'Temel İstatistikler'], highlighted: false, cta: 'Ücretsiz Başla' },
  { name: 'Başlangıç', desc: 'Büyüyen işletmeler için', monthly: 199, features: ['5 Temsilci', '1.000 Sohbet / Ay', 'Ziyaretçi Takibi', 'Chatbot & Otomasyon', 'Hazır Cevaplar', 'Dosya Yükleme', 'E-posta Bildirimleri'], highlighted: false, cta: 'Hemen Başla' },
  { name: 'Profesyonel', desc: 'Profesyonel ekipler için tam çözüm', monthly: 499, features: ['15 Temsilci', 'Sınırsız Sohbet', 'Ekran İzleme & Müdahale', 'WebRTC HD Paylaşım', 'AI Destekli Yardım', 'API & Webhook Desteği', 'Öncelikli Destek', 'Gelişmiş Analitik'], highlighted: true, cta: 'Hemen Başla' },
  { name: 'Kurumsal', desc: 'Büyük ölçekli işletmeler için', monthly: 999, features: ['Sınırsız Temsilci', 'Sınırsız Sohbet', 'Beyaz Etiket', 'SLA Garantisi', 'Özel Destek Hattı', 'Özel Entegrasyonlar', 'Alan Adı Özelleştirme', 'Tüm Özellikler'], highlighted: false, cta: 'İletişime Geç' },
]

const comparisonRows = [
  { name: 'Temsilci Sayısı', free: '2', starter: '5', pro: '15', biz: 'Sınırsız' },
  { name: 'Sohbet / Ay', free: '100', starter: '1.000', pro: 'Sınırsız', biz: 'Sınırsız' },
  { name: 'Gerçek Zamanlı Sohbet', free: true, starter: true, pro: true, biz: true },
  { name: 'Widget Özelleştirme', free: true, starter: true, pro: true, biz: true },
  { name: 'E-posta Bildirimleri', free: true, starter: true, pro: true, biz: true },
  { name: 'Ziyaretçi Takibi', free: false, starter: true, pro: true, biz: true },
  { name: 'Chatbot & Otomasyon', free: false, starter: true, pro: true, biz: true },
  { name: 'Hazır Cevaplar', free: false, starter: true, pro: true, biz: true },
  { name: 'Dosya Yükleme', free: false, starter: true, pro: true, biz: true },
  { name: 'Ekran İzleme (SD/HD)', free: false, starter: false, pro: true, biz: true },
  { name: 'WebRTC HD Paylaşım', free: false, starter: false, pro: true, biz: true },
  { name: 'Müdahale Modu', free: false, starter: false, pro: true, biz: true },
  { name: 'AI Destekli Yardım', free: false, starter: false, pro: true, biz: true },
  { name: 'API & Webhook', free: false, starter: false, pro: true, biz: true },
  { name: 'Beyaz Etiket', free: false, starter: false, pro: false, biz: true },
  { name: 'SLA Garantisi', free: false, starter: false, pro: false, biz: true },
  { name: 'Özel Destek Hattı', free: false, starter: false, pro: false, biz: true },
  { name: 'Özel Entegrasyon', free: false, starter: false, pro: false, biz: true },
]

const testimonials = [
  { quote: 'Müşteri hizmetlerimizde devrim yarattık. Ekran izleme ve anlık müdahale özellikleri sayesinde müşteri memnuniyetimiz %40 arttı. Gu Live Chat gerçekten harika bir platform.', author: 'Can Yıldırım', role: 'CEO, ModaVip', rating: 5 },
  { quote: 'Crisp\'ten geçtik, çok memnunuz. hem daha uygun fiyatlı hem de Türkçe destek mükemmel. Widget kurulumu saniyeler sürdü, chatbot sayesinde gelen taleplerin yarısı otomatik çözülüyor.', author: 'Seda Akgün', role: 'Operasyon Müdürü, Evinİçin', rating: 5 },
  { quote: 'En beğendiğim özellik dashboard\'un çok kapsamlı olması. Tüm kanallar tek ekranda, raporlar anlık. Profesyonel paket tam bir işletme çözümü sunuyor. Kesinlikle tavsiye ederim.', author: 'Burak Korkmaz', role: 'IT Müdürü, BoostAI', rating: 5 },
]

const faqs = [
  { q: 'Gu Live Chat\'i siteme eklemek ne kadar sürer?', a: 'Sadece 30 saniye! Tek satır kodu sitenize ekleyin, anında çalışmaya başlasın. Teknik bilgi gerektirmez. Dashboard\'dan her şeyi özelleştirebilirsiniz.' },
  { q: 'Ücretsiz pakette neler var?', a: '2 temsilci, ayda 100 sohbet, temel widget özelleştirmesi ve e-posta bildirimleri. Kredi kartı gerekmeden hemen başlayın. İstediğiniz zaman ücretli paketlere geçiş yapabilirsiniz.' },
  { q: 'Daha fazla pakete geçebilir miyim?', a: 'Evet! İstediğiniz zaman paket yükseltebilir veya düşürebilirsiniz. Fark ücreti günlük olarak hesaplanır (prorate). Hiçbir veri kaybı yaşamazsınız.' },
  { q: 'Verilerim güvende mi?', a: 'Tüm veriler SSL/TLS ile şifrelenir. Sunucularımız Avrupa\'da (Türkiye) bulunur, KVKK ve GDPR uyumlu çalışıyoruz. Düzenli yedekleme ve 99.9% uptime garantisi sunuyoruz.' },
  { q: 'Chatbot nasıl çalışıyor?', a: 'Görsel editör ile adımlar oluşturun: mesaj gönderme, seçenek sunma, e-posta toplama ve temsilciye aktarma. Kod yazmanıza gerek yok. AI destekli chatbot ile daha akıllı yanıtlar verebilirsiniz.' },
  { q: 'Crisp\'ten verilerimi taşıyabilir miyim?', a: 'Evet! Crisp\'ten Gu Live Chat\'e veri taşıma aracımız var. Tek tıkla tüm sohbet geçmişinizi, kişi bilgilerinizi ve ayarlarınızı aktarabilirsiniz.' },
]

function FadeInView({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''))
  const isPercentage = value.includes('%')
  const hasPlus = value.includes('+')
  const displaySuffix = isPercentage ? '%' : hasPlus ? '+' : suffix

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || numericValue <= 0) return
    let current = 1
    const stepTime = Math.max(30, 1200 / numericValue)
    function run() {
      if (current > numericValue) {
        setCount(numericValue)
        setTimeout(() => { current = 1; run() }, 1500)
        return
      }
      setCount(current)
      current++
      setTimeout(run, stepTime)
    }
    run()
  }, [visible, numericValue])

  return <div ref={ref} className="tabular-nums">{count}{displaySuffix}</div>
}

function PricingCard({ plan, billingPeriod, yearlyDiscount, idx }: {
  plan: typeof plans[0]; billingPeriod: 'monthly' | 'yearly'; yearlyDiscount: number; idx: number
}) {
  const isYearly = billingPeriod === 'yearly'
  const price = isYearly ? Math.round(plan.monthly * (1 - yearlyDiscount)) : plan.monthly
  const yearlyTotal = isYearly && plan.monthly > 0 ? plan.monthly * 12 : 0
  const yearlyBilled = isYearly && plan.monthly > 0 ? price * 12 : 0

  return (
    <FadeInView delay={idx * 0.08} className="h-full">
      <div className={`relative h-full surface p-6 flex flex-col ${plan.highlighted ? 'border-primary/50 shadow-brand scale-[1.03] sm:scale-[1.04] z-10' : ''}`}>
        {plan.highlighted && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-brand text-white text-[11px] font-bold rounded-full shadow-brand whitespace-nowrap">
            En Popüler
          </span>
        )}
        <h3 className={`text-lg font-bold text-foreground ${plan.highlighted ? 'mt-2' : ''}`}>{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.desc}</p>
        <div className="mt-5 mb-1">
          {plan.monthly === 0 ? (
            <span className="text-4xl font-bold text-foreground tracking-tight">Ücretsiz</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground tracking-tight">₺{price}</span>
              <span className="text-sm text-muted-foreground">/ay</span>
            </div>
          )}
        </div>
        {isYearly && plan.monthly > 0 && (
          <p className="text-xs text-success font-medium mt-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            ₺{yearlyBilled}/yıl fatura &mdash; <span className="line-through text-muted-foreground">₺{yearlyTotal}/yıl</span>
          </p>
        )}
        {plan.monthly === 0 && <div className="mt-6" />}
        {plan.monthly > 0 && <div className="mt-4" />}
        <Link href="/register" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all mt-5 ${
          plan.highlighted
            ? 'bg-gradient-brand text-white shadow-brand hover:shadow-brand-lg hover:scale-[1.02]'
            : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
        }`}>
          {plan.cta}
        </Link>
        <ul className="space-y-3 mt-6 flex-1">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </FadeInView>
  )
}

function renderCell(value: boolean | string) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-success mx-auto" />
      : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
  }
  return <span className="text-foreground font-medium">{value}</span>
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const yearlyDiscount = 0.2

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Gerçek widget — sahte demo chat yerine canlı Gu Chat widget'ı
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo boyut="default" linkOlsun animasyonlu />

            <div className="hidden md:flex items-center gap-1">
              {[
                { label: '✨ Özellikler', href: '#features' },
                { label: '💰 Fiyatlandırma', href: '#pricing' },
                { label: '🧩 Eklentiler', href: '#addons' },
                { label: '❓ SSS', href: '#faq' },
              ].map((item, i) => (
                <a key={item.label} href={item.href}
                  className="px-5 py-2.5 text-base font-semibold text-foreground/70 hover:text-foreground rounded-xl hover:bg-primary-light hover:scale-105 transition-all duration-200"
                  style={{ animation: `fade-in 0.4s ease-out ${i * 0.1}s both` }}>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors px-5 py-2.5 rounded-xl hover:bg-primary-light">
                Giriş Yap
              </Link>
              <Link href="/register" className="relative group">
                <div className="absolute -inset-1 bg-gradient-brand rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:blur-lg" />
                <span className="relative px-5 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-transform duration-200 group-hover:scale-[1.02]">
                  Ücretsiz Başla <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-primary-light transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {[
              { label: 'Özellikler', href: '#features' },
              { label: 'Fiyatlandırma', href: '#pricing' },
              { label: 'Eklentiler', href: '#addons' },
              { label: 'SSS', href: '#faq' },
            ].map(item => (
              <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-primary-light transition-colors">
                {item.label}
              </a>
            ))}
            <div className="border-t border-border mt-3 pt-3 space-y-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                Giriş Yap
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                className="block px-5 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-xl text-center shadow-brand">
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute inset-0 bg-dots opacity-[0.03] pointer-events-none" />

        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-indigo-500/6 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2.5s' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-light text-primary rounded-full text-sm font-medium mb-8 animate-in-up shadow-xs">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Türk yapımı canlı destek sistemi
              <ChevronRight className="w-3 h-3" />
            </div>

            <FadeInView className="flex justify-center mb-6">
              <Logo boyut="hero" metinGoster={false} />
            </FadeInView>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] animate-in-up">
              Müşterilerinizle<br />
              <span className="animate-text-shimmer">Anında</span> Bağlantı Kurun
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in-up" style={{ animationDelay: '0.1s' }}>
              Gu Live Chat ile web sitenize profesyonel canlı destek ekleyin.
              Gerçek zamanlı mesajlaşma, yapay zeka destekli chatbot ve ziyaretçi takibi.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/register" className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-brand rounded-xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:blur-2xl" />
                <span className="relative px-8 py-4 bg-gradient-brand text-white font-semibold rounded-xl text-lg flex items-center gap-2 shadow-brand-lg transition-transform duration-200 group-hover:scale-[1.02]">
                  Ücretsiz Başla <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <a href="#features" className="group px-8 py-4 surface-hover font-semibold rounded-xl text-lg flex items-center gap-2 transition-all duration-200">
                Özellikleri Keşfet <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              </a>
            </div>
            <FadeInView delay={0.3} className="mt-16">
              <div className="grid grid-cols-3 gap-8 sm:gap-12 max-w-lg mx-auto">
                {[
                  { value: '10K+', label: 'Aktif Kullanıcı' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: '30', label: 'Kurulum Süresi', suffix: 'sn' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeInView>
          </div>

          <FadeInView delay={0.4} className="mt-20 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-brand rounded-3xl blur-3xl opacity-[0.08] pointer-events-none" />
              <div className="relative glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border bg-card/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/80" />
                    <div className="w-3 h-3 rounded-full bg-warning/80" />
                    <div className="w-3 h-3 rounded-full bg-success/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs font-medium text-muted-foreground">gu-live-chat.com</span>
                  </div>
                  <div className="w-16" />
                </div>

                <div className="flex flex-col sm:flex-row">
                  <div className="hidden sm:flex w-56 shrink-0 border-r border-border bg-card/20 p-3 flex-col gap-0.5">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Sohbetler</div>
                    {[
                      { name: 'Ali Yılmaz', active: true, last: 'Merhaba, yardıma ihtiyacım var' },
                      { name: 'Ayşe Demir', active: false, last: 'Teşekkür ederim, çözdüm' },
                      { name: 'Mehmet Kaya', active: false, last: 'Ürün iadesi yapmak istiyorum' },
                      { name: 'Zeynep Şahin', active: false, last: 'Fatura ile ilgili sorun var' },
                    ].map((c, i) => (
                      <div key={c.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${i === 0 ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-primary-light/40 cursor-pointer'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-gradient-brand text-white' : 'bg-muted text-muted-foreground'}`}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="truncate text-xs font-medium">{c.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground/70">{c.last}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="p-4 border-b border-border bg-card/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-brand shrink-0">
                          G
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">Destek Ekibi</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                            Çevrimiçi &middot; Tipik yanıt: 2 dk
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 min-h-[260px] bg-background/40">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-brand shrink-0 flex items-center justify-center text-white text-[10px] font-bold">G</div>
                        <div className="bg-card rounded-xl rounded-tl-none p-3.5 max-w-[80%] shadow-xs border border-border">
                          <p className="text-sm text-foreground">Merhaba! Size nasıl yardımcı olabiliriz?</p>
                          <span className="text-[11px] text-muted-foreground mt-1.5 block">Şimdi</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="bg-gradient-brand text-white rounded-xl rounded-tr-none p-3.5 max-w-[80%] shadow-xs">
                          <p className="text-sm">Merhaba, ürün iadesi yapmak istiyorum.</p>
                          <span className="text-[11px] text-white/70 mt-1.5 block">Şimdi</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-brand shrink-0 flex items-center justify-center text-white text-[10px] font-bold">G</div>
                        <div className="bg-card rounded-xl rounded-tl-none p-3.5 max-w-[80%] shadow-xs border border-border">
                          <p className="text-sm text-foreground">Tabii ki! İade sürecinizi başlatmanıza yardımcı olayım. Sipariş numaranızı paylaşır mısınız?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-brand shrink-0 flex items-center justify-center text-white text-[10px] font-bold">G</div>
                        <div className="bg-card rounded-xl rounded-tl-none p-3.5 max-w-[80%] shadow-xs border border-border">
                          <p className="text-sm text-foreground">Bu arada, ekran paylaşımı ile sorunu daha hızlı çözebiliriz. İzin verir misiniz?</p>
                          <div className="flex gap-2 mt-3">
                            <button className="px-3.5 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition shadow-xs">Evet, Paylaş</button>
                            <button className="px-3.5 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:bg-border transition">Hayır</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 border-t border-border bg-card/30">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Mesajınızı yazın..." readOnly
                          className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-shadow" />
                        <button className="p-2.5 bg-gradient-brand text-white rounded-xl shadow-brand hover:shadow-brand-lg transition-all">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      <section className="py-14 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-8">
              Güvenen Markalar
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
               {['TrendyShop', 'HızlıMarket', 'TeknoSoft', 'ModaVip', 'Evinİçin', 'BoostAI'].map((name, i) => (
                <span key={name} className="text-xl font-bold tracking-tight" style={{
                  color: '#FFFFFF', opacity: 0.7,
                  textShadow: '0 0 20px rgba(124,77,246,0.3), 0 0 40px rgba(124,77,246,0.15)',
                  animation: `fade-in 0.5s ease-out ${i * 0.1}s both, pulse 3s ease-in-out ${i * 0.1}s infinite`,
                }}>{name}</span>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <FadeInView>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Özellikler</span>
            </div>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight animate-text-gradient">İhtiyacınız olan her şey</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Müşteri destek sürecinizi hızlandıracak güçlü özellikler, tek platformda.
              </p>
            </div>
          </FadeInView>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureData.map((feature, i) => (
              <FadeInView key={feature.title} delay={i * 0.05}>
                <div className="group surface-hover p-6 h-full transition-all duration-300 hover:-translate-y-1">
                  <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:bg-gradient-brand group-hover:text-white transition-all duration-300 shadow-xs group-hover:shadow-brand">
                    <feature.icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeInView>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Nasıl Çalışır?</span>
            </div>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">3 Adımda Başlayın</h2>
              <p className="mt-4 text-lg text-muted-foreground">Dakikalar içinde canlı desteği sitenize ekleyin.</p>
            </div>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-[2px] bg-gradient-to-r from-primary/30 via-primary/20 to-transparent" />

            {[
              { step: '01', title: 'Hesap Oluşturun', desc: 'Ücretsiz kayıt olun ve dashboard\'unuza erişin. Kredi kartı gerekmez.', icon: MessageSquare },
              { step: '02', title: 'Widget\'ı Özelleştirin', desc: 'Renk, pozisyon ve mesajlarınızı markanıza uygun ayarlayın.', icon: Sparkles },
              { step: '03', title: 'Sitenize Ekleyin', desc: 'Tek satır kod kopyalayıp yapıştırın. Anında müşterilerinizle sohbet edin!', icon: Zap },
            ].map((item, i) => (
              <FadeInView key={item.step} delay={i * 0.12}>
                <div className="text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-5 shadow-brand-lg relative z-10">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-xs font-bold mb-5 relative z-10 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{item.desc}</p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section id="addons" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <FadeInView>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Eklentiler</span>
            </div>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">Ek özelliklerle gücünüzü artırın</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Eklenti mağazamızdan ihtiyacınız olan ek hizmetleri seçin.
              </p>
            </div>
          </FadeInView>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addonData.map((addon, i) => (
              <FadeInView key={addon.title} delay={i * 0.08}>
                <div className="relative group h-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full surface-hover p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-foreground">{addon.title}</h3>
                      {addon.popular && (
                        <span className="text-[10px] font-bold bg-gradient-brand text-white px-2.5 py-0.5 rounded-full shadow-brand shrink-0 ml-2">
                          Popüler
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{addon.desc}</p>
                    <div className="flex items-end justify-between pt-2 border-t border-border">
                      <div>
                        <span className="text-xl font-bold text-foreground tracking-tight">{addon.price}</span>
                      </div>
                      <button className="px-4 py-2 bg-primary-light text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-all duration-200 shadow-xs hover:shadow-brand">
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>

          <FadeInView className="mt-10 text-center">
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors group">
              Tüm eklentileri görüntüle
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </FadeInView>
        </div>
      </section>

      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-mesh opacity-[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <FadeInView>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Fiyatlandırma</span>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight animate-text-gradient">Basit, şeffaf fiyatlandırma</h2>
              <p className="mt-4 text-lg text-muted-foreground">İşletmenizin büyüklüğüne uygun paketi seçin.</p>
            </div>
          </FadeInView>

          <FadeInView delay={0.1} className="flex items-center justify-center gap-4 mb-14">
            <span className={`text-sm font-medium transition-colors duration-300 ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Aylık</span>
            <button onClick={() => setBillingPeriod(p => p === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${billingPeriod === 'yearly' ? 'bg-primary shadow-brand' : 'bg-border'}`}>
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${billingPeriod === 'yearly' ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yıllık
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                2 Ay Ücretsiz
              </span>
            </span>
          </FadeInView>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-start">
            {plans.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} billingPeriod={billingPeriod} yearlyDiscount={yearlyDiscount} idx={i} />
            ))}
          </div>

          <FadeInView delay={0.2} className="mt-20">
            <h3 className="text-xl font-bold text-center text-foreground mb-10">Tüm özellikleri karşılaştırın</h3>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 pl-6 font-semibold text-foreground">Özellik</th>
                    <th className="p-4 font-semibold text-foreground text-center">Ücretsiz</th>
                    <th className="p-4 font-semibold text-foreground text-center">Başlangıç</th>
                    <th className="p-4 font-semibold text-primary text-center">Profesyonel</th>
                    <th className="p-4 font-semibold text-foreground text-center pr-6">Kurumsal</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.name} className={`border-b border-border transition-colors hover:bg-primary-light/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                      <td className="p-4 pl-6 text-muted-foreground font-medium">{row.name}</td>
                      <td className="p-4 text-center">{renderCell(row.free)}</td>
                      <td className="p-4 text-center">{renderCell(row.starter)}</td>
                      <td className="p-4 text-center">{renderCell(row.pro)}</td>
                      <td className="p-4 text-center pr-6">{renderCell(row.biz)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInView>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <FadeInView>
            <div className="text-center mb-4 mt-20">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Ekibimiz</span>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">7/24 Canlı Destek Ekibi</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Uzman ekibimizle daima yanınızdayız.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mb-16">
              {[
                { name: 'Can', role: 'Destek Lideri', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=140&h=140&fit=crop&crop=face&q=80' },
                { name: 'Selin', role: 'Satış Uzmanı', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=140&h=140&fit=crop&crop=face&q=80' },
                { name: 'Merve', role: 'Teknik Destek', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&h=140&fit=crop&crop=face&q=80' },
              ].map((member, i) => (
                <div key={member.name} className="text-center group" style={{ animation: `fade-in 0.5s ease-out ${i * 0.15}s both` }}>
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
                    <img src={member.photo} alt={member.name} className="w-full h-full rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/50 transition-all duration-300 shadow-lg" />
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">Müşteri Yorumları</span>
            </div>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">Müşterilerimiz ne diyor?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">1.000&apos;den fazla işletme Gu Live Chat ile müşteri memnuniyetini artırıyor.</p>
            </div>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeInView key={t.author} delay={i * 0.1}>
                <div className="surface p-7 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-brand shrink-0">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <FadeInView>
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3.5 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">SSS</span>
            </div>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">Sık Sorulan Sorular</h2>
            </div>
          </FadeInView>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeInView key={i} delay={i * 0.05}>
                <div className="surface overflow-hidden transition-all duration-300 hover:shadow-md">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors duration-200">
                    <span className="font-medium text-foreground text-sm sm:text-base pr-4">{faq.q}</span>
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      {openFaq === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </div>
                  </button>
                  <div className={`transition-all duration-300 overflow-hidden ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand" />
        <div className="absolute inset-0 bg-grid opacity-[0.05]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeInView>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight animate-text-shimmer-white">Hemen başlayın, saniyeler içinde kurun</h2>
            <p className="mt-5 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Kredi kartı gerekmeden ücretsiz deneyin. İlk 100 sohbet tamamen ücretsiz.
            </p>
          </FadeInView>

          <FadeInView delay={0.15} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="relative group">
              <div className="absolute -inset-1 bg-white/30 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-all duration-500 animate-pulse-glow" />
              <span className="relative px-8 py-4 bg-white text-primary font-semibold rounded-xl text-lg flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 group-hover:scale-[1.02]">
                Ücretsiz Hesap Oluştur <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/register" className="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl text-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-2 hover:border-white/30">
              <Phone className="w-4 h-4" /> Bize Ulaşın
            </Link>
          </FadeInView>
        </div>
      </section>

      <footer className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-14">
            <div className="col-span-2 lg:col-span-1">
              <Logo boyut="sm" linkOlsun animasyonlu={false} className="mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[200px]">
                Türk yapımı, profesyonel canlı destek sistemi. Crisp&apos;e yerli alternatif.
              </p>
              <div className="flex items-center gap-2.5">
                {[
                  { icon: MessageCircle, href: '#' },
                  { icon: Mail, href: '#' },
                  { icon: Globe, href: '#' },
                  { icon: MessageSquare, href: '#' },
                ].map((social, i) => (
                  <a key={i} href={social.href}
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-primary-light text-muted-foreground hover:text-primary flex items-center justify-center transition-all duration-200 hover:shadow-xs">
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Ürün', links: [
                { label: 'Özellikler', href: '#features' },
                { label: 'Fiyatlandırma', href: '#pricing' },
                { label: 'Eklentiler', href: '#addons' },
                { label: 'SSS', href: '#faq' },
              ]},
              { title: 'Destek', links: [
                { label: 'SSS', href: '#faq' },
                { label: 'Giriş Yap', href: '/login' },
                { label: 'Kayıt Ol', href: '/register' },
              ]},
              { title: 'Şirket', links: [
                { label: 'Kayıt Ol', href: '/register' },
                { label: 'Demo Talep Et', href: '/register' },
              ]},
              { title: 'Yasal', links: [
                { label: 'Gizlilik Politikası', href: '/gizlilik' },
                { label: 'Kullanım Şartları', href: '/kullanim-sartlari' },
                { label: 'KVKK Aydınlatma', href: '/kvkk' },
                { label: 'Çerez Politikası', href: '/cerez-politikasi' },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-[0.12em] mb-4">{col.title}</h4>
                <div className="space-y-3">
                  {col.links.map(link => {
                    const href = typeof link === 'string' ? '#' : link.href
                    const label = typeof link === 'string' ? link : link.label
                    return (
                      <Link key={label} href={href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                        {label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Copyright className="w-3.5 h-3.5" />
              <span className="flex items-center gap-2" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>By Design</span>{' '}
                <span style={{ color: '#FFFFFF', fontWeight: 700, textShadow: '0 0 10px rgba(220,38,38,0.5), 0 0 20px rgba(220,38,38,0.3)' }}>UğuR</span>
                <span style={{ color: '#9CA3AF', fontSize: '12px' }}>© 2026</span>
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" />KVKK Uyumlu</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />Türkiye&apos;de Üretildi</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-success rounded-full animate-pulse" />99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
