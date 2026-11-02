'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Headphones,
  Shield,
  Clock,
  Check,
  Play,
} from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useLocale } from '@/components/marketing/locale-provider'
import { HeroPreview } from '@/components/marketing/hero-preview'
import { GU_BRAND } from '@/lib/brand-theme'

export function HeroFeaturePills() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const items = [
    {
      icon: Headphones,
      title: lang === 'en' ? 'Experienced Team' : 'Deneyimli Ekip',
      desc:
        lang === 'en'
          ? 'Live support experts and AI working together for your customers.'
          : 'Canlı destek uzmanları ve AI birlikte müşterilerinize hizmet verir.',
    },
    {
      icon: Shield,
      title: lang === 'en' ? 'Safe & Trusted' : 'Güvenli & KVKK',
      desc:
        lang === 'en'
          ? 'Turkish infrastructure, secure payments, privacy-compliant data handling.'
          : 'Türk altyapısı, güvenli ödeme ve KVKK uyumlu veri işleme.',
    },
    {
      icon: Clock,
      title: lang === 'en' ? '24/7 Online Support' : '7/24 Çevrimiçi Destek',
      desc:
        lang === 'en'
          ? 'Widget, WhatsApp and AI — respond anytime, from anywhere.'
          : 'Widget, WhatsApp ve AI — her an, her yerden yanıt verin.',
    },
  ]

  return (
    <div className="relative z-10 -mt-8 sm:-mt-14 pb-16 sm:pb-20 max-w-6xl mx-auto px-4 sm:px-6 marketing-section-light">
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        {items.map((item, i) => (
          <FadeIn key={item.title} delay={0.08 + i * 0.05}>
            <div className="ecall-hero-pill">
              <div className="ecall-hero-pill-icon">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

export function AboutSplitSection() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const bullets =
    lang === 'en'
      ? [
          'Real-time chat with visitor tracking and page context',
          'AI + live agent handoff without losing conversation history',
          'Multi-channel inbox: widget, WhatsApp, email and more',
        ]
      : [
          'Ziyaretçi takibi ve sayfa bağlamı ile gerçek zamanlı sohbet',
          'Konuşma geçmişi kaybolmadan AI + canlı temsilci devri',
          'Çok kanallı inbox: widget, WhatsApp, e-posta ve daha fazlası',
        ]

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 premium-section-light">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <FadeIn>
          <HeroPreview />
        </FadeIn>
        <FadeIn delay={0.08}>
          <span className="premium-section-tag mb-4 inline-block">
            {lang === 'en' ? 'Best Customer Experience' : 'En İyi Müşteri Deneyimi'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight premium-heading">
            {lang === 'en'
              ? 'The best live chat & customer support for your business'
              : 'İşletmeniz için en iyi canlı destek ve müşteri hizmetleri'}
          </h2>
          <p className="mt-4 premium-body leading-relaxed">
            {lang === 'en'
              ? 'Gu Live Chat helps Turkish and global businesses convert visitors into loyal customers with professional support tools — without enterprise complexity.'
              : 'Gu Live Chat, Türk ve global işletmelerin ziyaretçilerini profesyonel destek araçlarıyla sadık müşterilere dönüştürmesine yardımcı olur — kurumsal karmaşıklık olmadan.'}
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm premium-body">
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: GU_BRAND.accentLight, color: GU_BRAND.accent }}>
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-primary mt-8 px-7 py-3.5 rounded-xl inline-flex text-base">
            {lang === 'en' ? 'Get Started' : 'Hemen Başla'} <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}

export function HowItWorksSteps() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const steps = [
    {
      title: lang === 'en' ? 'Create Account' : 'Hesap Oluşturun',
      desc: lang === 'en' ? 'Sign up free — no credit card required.' : 'Ücretsiz kayıt — kredi kartı gerekmez.',
    },
    {
      title: lang === 'en' ? 'Add Widget Code' : 'Widget Kodunu Ekleyin',
      desc: lang === 'en' ? 'Copy snippet to your site in 30 seconds.' : 'Snippet\'ı 30 saniyede sitenize yapıştırın.',
    },
    {
      title: lang === 'en' ? 'Connect Channels' : 'Kanalları Bağlayın',
      desc: lang === 'en' ? 'WhatsApp, email and social from one inbox.' : 'WhatsApp, e-posta ve sosyal — tek inbox.',
    },
    {
      title: lang === 'en' ? 'Support Customers' : 'Müşterilere Yanıt Verin',
      desc: lang === 'en' ? 'AI + team — faster resolutions, happier clients.' : 'AI + ekip — hızlı çözüm, mutlu müşteri.',
    },
  ]

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 marketing-section-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${GU_BRAND.primaryGlow}, transparent 60%)` }} />
      <div className="max-w-6xl mx-auto relative">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="ecall-section-tag"># {lang === 'en' ? 'How It Works' : 'Nasıl Çalışır'}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {lang === 'en' ? 'How It Works' : 'Nasıl Çalışır'}
            </h2>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.06}>
              <div className="ecall-step-card h-full">
                <div className="ecall-step-num">{i + 1}</div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FullWidthCtaBanner() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="ecall-cta-banner rounded-3xl px-8 py-16 sm:py-20 text-center text-white relative">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block text-sm font-bold text-[var(--premium-gold,#c9922e)] mb-3 tracking-wide">
                # Gu Live Chat
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {lang === 'en'
                  ? 'Live support solutions for your business'
                  : 'İşletmeniz için canlı destek çözümleri'}
              </h2>
              <p className="mt-4 text-white/75 text-lg leading-relaxed">
                {lang === 'en'
                  ? 'Start free today. Widget, AI, WhatsApp and unified inbox — ready in minutes.'
                  : 'Bugün ücretsiz başlayın. Widget, AI, WhatsApp ve birleşik inbox — dakikalar içinde hazır.'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-white hover:bg-white/95 transition-colors shadow-lg text-[var(--marketing-cta,#121110)]">
                  {lang === 'en' ? 'Start Free' : 'Ücretsiz Başla'} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/demo" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors">
                  <Play className="w-4 h-4" /> {lang === 'en' ? 'Watch Demo' : 'Demo İzle'}
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
