'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { getMarketingPlanCta } from '@/lib/plan-cta'
import {
  ArrowRight, Bot, BookOpen, BarChart3, MessageCircle, Users,
  Workflow, Mail, Smartphone, MessageSquare, Sparkles, Inbox, Zap,
  Check, Star, Plus, Minus, Headphones, TrendingUp, Megaphone, Languages, Globe, Download,
} from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { HeroPreview } from '@/components/marketing/hero-preview'
import { HOME_FAQS } from '@/lib/home-faqs'
import { trialHeroLine } from '@/lib/trial-config'

const trustedBrands = ['TrendyShop', 'TeknoSoft', 'ModaVip', 'Evinİçin', 'BoostAI', 'HızlıMarket']

const featureGrid = [
  { icon: MessageCircle, title: 'Anlık Sohbet', desc: 'Milisaniyelik mesajlaşma, yazıyor göstergesi ve dosya paylaşımı.' },
  { icon: Bot, title: 'AI Sohbet Asistanı', desc: 'GPT/Gemini ile insan gibi yanıt — Profesyonel pakette dahil, alt paketlerde eklenti.' },
  { icon: Inbox, title: 'Birleşik Inbox', desc: 'Widget, e-posta ve mesajlaşma kanalları tek ekranda.' },
  { icon: Languages, title: 'Canlı Çeviri', desc: '50+ dilde çift yönlü anlık çeviri — temsilci ve ziyaretçi kendi dilinde konuşur.' },
  { icon: Users, title: 'Ziyaretçi Takibi', desc: 'Canlı ziyaretçi listesi, sayfa geçmişi ve davranış analizi.' },
  { icon: BookOpen, title: 'Bilgi Bankası', desc: 'Self-servis yardım merkezi ile destek yükünü azaltın.' },
  { icon: BarChart3, title: 'Analitik', desc: 'Yanıt süreleri, çözüm oranları ve ekip performansı.' },
]

const aiSteps = [
  { step: '1', title: 'Bilgi bankasını bağlayın', desc: 'Makalelerinizi yükleyin, AI bağlamı öğrensin.' },
  { step: '2', title: 'Akışları tanımlayın', desc: 'Karşılama, yönlendirme ve eskalasyon kurallarını belirleyin.' },
  { step: '3', title: '7/24 yanıt verin', desc: 'AI asistan gece gündüz müşterilerinize yardımcı olsun.' },
  { step: '4', title: 'Temsilciye devredin', desc: 'Karmaşık talepler tek tıkla canlı temsilciye aktarılır.' },
]

const channels = [
  { icon: MessageCircle, label: 'Widget', active: true },
  { icon: Mail, label: 'E-posta', active: true },
  { icon: Smartphone, label: 'WhatsApp', active: true },
  { icon: MessageSquare, label: 'Messenger', active: true },
  { icon: MessageCircle, label: 'Instagram', active: true },
  { icon: MessageCircle, label: 'Telegram', active: true },
]

const products = [
  { icon: MessageCircle, title: 'Sohbet Widget\'ı', desc: 'Sitenize saniyeler içinde ekleyin. Tam özelleştirilebilir.', href: '/features#widget' },
  { icon: Users, title: 'Müşteri CRM', desc: 'Kişi profilleri, sohbet geçmişi ve etiketlerle ilişkileri yönetin.', href: '/features#crm' },
  { icon: Bot, title: 'AI Motoru', desc: 'Akıllı yanıtlar, otomatik sınıflandırma ve öneri sistemi.', href: '/ai' },
  { icon: BarChart3, title: 'Analitik Panel', desc: 'Gerçek zamanlı metrikler ve dışa aktarılabilir raporlar.', href: '/features#analytics' },
]

const useCases = [
  {
    id: 'support',
    label: 'Destek',
    icon: Headphones,
    title: 'Müşteri desteğini hızlandırın',
    desc: 'Ortalama yanıt süresini kısaltın, çözüm oranını artırın. Hazır cevaplar ve bilgi bankası ile ekibinizi güçlendirin.',
    bullets: ['Çok kanallı inbox', 'SLA takibi', 'Memnuniyet puanlaması'],
  },
  {
    id: 'sales',
    label: 'Satış',
    icon: TrendingUp,
    title: 'Ziyaretçileri müşteriye dönüştürün',
    desc: 'Proaktif mesajlar ve canlı sohbet ile satış fırsatlarını kaçırmayın. Ziyaretçi davranışına göre doğru anda müdahale edin.',
    bullets: ['Proaktif tetikleyiciler', 'Ziyaretçi profili', 'Lead yakalama'],
  },
  {
    id: 'marketing',
    label: 'Pazarlama',
    icon: Megaphone,
    title: 'Kampanyalarla etkileşimi artırın',
    desc: 'Hedefli mesajlar, duyurular ve otomasyon akışları ile doğru kitleye ulaşın.',
    bullets: ['Kampanya yönetimi', 'Segmentasyon', 'A/B test desteği'],
  },
]

const testimonials = [
  { quote: 'Ekran izleme ve anlık müdahale sayesinde müşteri memnuniyetimiz belirgin şekilde arttı.', author: 'Can Y.', role: 'CEO, ModaVip' },
  { quote: 'Widget kurulumu saniyeler sürdü. Chatbot gelen taleplerin yarısını otomatik çözüyor.', author: 'Seda A.', role: 'Operasyon Müdürü' },
  { quote: 'Tüm kanallar tek ekranda, raporlar anlık. Profesyonel paket tam bir iş çözümü.', author: 'Burak K.', role: 'IT Müdürü' },
]

const plans = [
  { id: 'FREE' as const, name: 'Ücretsiz', monthly: 0, desc: 'Başlamak için ideal', features: ['2 Temsilci', '100 Sohbet / Ay', 'Temel Widget', 'E-posta Bildirimleri'], highlighted: false },
  { id: 'STARTER' as const, name: 'Başlangıç', monthly: 1790, desc: 'Büyüyen işletmeler', features: ['5 Temsilci', '1.000 Sohbet / Ay', 'Ziyaretçi Takibi', 'Bilgi Bankası & Bilet', 'Hazır Cevaplar', 'AI Sohbet (eklenti ile)'], highlighted: false },
  { id: 'PRO' as const, name: 'Profesyonel', monthly: 3790, desc: 'Profesyonel ekipler', features: ['25 Temsilci', 'Sınırsız Sohbet', 'AI Sohbet Asistanı (GPT/Gemini)', 'Chatbot Oluşturucu', '50+ Dil Çeviri', 'WhatsApp / E-posta / Messenger', 'API & Webhook', 'Analitik & Raporlar'], highlighted: true },
  { id: 'BUSINESS' as const, name: 'Kurumsal', monthly: 11990, desc: 'Büyük ölçekli çözüm', features: ['Sınırsız Temsilci', 'Sınırsız Sohbet', 'AI Sohbet Asistanı & Chatbot', 'Özel Marka (White-label)', 'SLA Garantisi (%99.9)', '7/24 Öncelikli Destek', 'Özel Entegrasyon'], highlighted: false },
]

const faqs = HOME_FAQS

function PricingCard({ plan, billing, discount, idx, isLoggedIn }: {
  plan: typeof plans[0]; billing: 'monthly' | 'yearly'; discount: number; idx: number; isLoggedIn: boolean
}) {
  const price = billing === 'yearly' && plan.monthly > 0
    ? Math.round(plan.monthly * (1 - discount))
    : plan.monthly
  const cta = getMarketingPlanCta(plan.id, { isLoggedIn })

  return (
    <FadeIn delay={idx * 0.06} className="h-full">
      <div className={`h-full surface p-6 flex flex-col ${plan.highlighted ? 'border-primary ring-1 ring-primary/20' : ''}`}>
        {plan.highlighted && (
          <span className="self-start mb-3 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wide">Popüler</span>
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
        <Link href={cta.href}
          className={`text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
          }`}>
          {cta.label}
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

export function HomeHero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 bg-primary-light text-primary border border-primary/10">
              <Sparkles className="w-3.5 h-3.5" />
              Ziyaretçi takibi · Canlı sohbet · AI
            </span>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight leading-[1.12] text-foreground">
              Ziyaretçinizi müşteriye dönüştürmenin{' '}
              <span className="text-primary">en etkili yolu</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Ziyaretçi sitedeyken canlı sohbet ve proaktif mesajlarla müdahale edin. AI destekli, tüm kanallar tek inbox&apos;ta.
            </p>
          </FadeIn>
          <FadeIn delay={0.18}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto">
              <a
                href="/downloads/guchat.apk"
                download="GuChat.apk"
                className="lg:hidden w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-5 h-5" />
                Android Uygulamayı İndir
              </a>
              <Link href="/register" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ai" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto">
                AI özelliklerini keşfet
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {trialHeroLine()}
            </p>
          </FadeIn>
        </div>
        <FadeIn delay={0.22} className="mt-16 sm:mt-20">
          <HeroPreview />
        </FadeIn>
      </div>
    </section>
  )
}

export function TrustStrip() {
  return (
    <section className="py-10 border-y border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">Güvenen işletmeler</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {trustedBrands.map((name) => (
            <span key={name} className="text-base font-semibold text-muted-foreground/50 select-none">{name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MobileAppSection() {
  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

            <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 mb-5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Android Uygulama
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                  Android uygulamamızı buradan yükleyin
                </h2>
                <p className="mt-4 text-base sm:text-lg text-emerald-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Evde, işte, her yerde — dışarıda bile müşterilerinizle konuşmaya devam edin.
                  Gelen kutusu, bildirimler ve hızlı yanıt cebinizde.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center lg:items-start justify-center lg:justify-start gap-3">
                  <a
                    href="/downloads/guchat.apk"
                    download="GuChat.apk"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-emerald-950 bg-white hover:bg-emerald-50 shadow-xl shadow-black/20 transition-colors w-full sm:w-auto"
                  >
                    <Download className="w-5 h-5" />
                    APK İndir — Ücretsiz
                  </a>
                  <Link
                    href="/mobil-indir"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-white/90 border border-white/20 hover:bg-white/10 transition-colors w-full sm:w-auto"
                  >
                    Kurulum adımları <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="mt-4 text-xs text-emerald-200/60">Android 7.0+ · Gu Chat hesabınızla giriş yapın</p>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/20 blur-2xl scale-110" />
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] overflow-hidden ring-2 ring-white/20 shadow-2xl shadow-black/40">
                    <Image
                      src="/app-icon.png"
                      alt="Gu Chat Android uygulama ikonu"
                      width={176}
                      height={176}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="section-label mb-4">Özellikler</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Her şey tek çatı altında</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Müşteri destek sürecinizi uçtan uca yönetmek için ihtiyacınız olan araçlar.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureGrid.map((f, i) => (
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
  )
}

export function AiShowcase() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="ai" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">AI Agent</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              Sohbetlerin büyük kısmını otomatik çözün
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Gu Chat AI Agent standart talepleri anında işler, bilgi bankasından yanıt verir ve
              ekibinizin çalışma saatlerinden tasarruf sağlar — yeni personel işe almadan desteği ölçeklendirin.
            </p>
            <div className="mt-8 space-y-3">
              {aiSteps.map((s, i) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeStep === i ? 'border-primary bg-primary-light/50' : 'border-border bg-card hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeStep === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>{s.step}</span>
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Link href="/ai" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              AI özelliklerini keşfet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden aspect-video flex items-center justify-center bg-gradient-brand-subtle">
              <div className="absolute inset-0 bg-grid opacity-40" />
              <div className="relative text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 animate-float">
                  <Sparkles className="w-8 h-8" />
                </div>
                <p className="font-semibold text-lg">{aiSteps[activeStep].title}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{aiSteps[activeStep].desc}</p>
                <div className="mt-6 flex justify-center gap-1.5">
                  {aiSteps.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${activeStep === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

const translateDemo = [
  { lang: '🇩🇪 Almanca', msg: 'Wo ist meine Bestellung?', tr: 'Siparişim nerede?' },
  { lang: '🇬🇧 English', msg: 'I need a refund please', tr: 'İade talep ediyorum lütfen' },
  { lang: '🇫🇷 Français', msg: 'Pouvez-vous m\'aider?', tr: 'Bana yardım edebilir misiniz?' },
]

export function LiveTranslateSection() {
  return (
    <section id="translate" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">Canlı Çeviri</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              Dünyanın her yerinden müşteriyle konuşun
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Supsis ve JivoChat tarzı gerçek zamanlı çift yönlü çeviri. Temsilci kendi dilinde yazar,
              ziyaretçi kendi dilinde okur — widget, gelen kutusu ve admin panelde aynı motor.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {['20+ dil desteği (Google + AI motor)', 'Gelen kutusunda otomatik algılama', 'Widget\'ta tek tık çeviri', 'PRO pakette sınırsız'].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />{b}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              PRO paketini incele <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="surface p-5 lg:p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                <Globe className="w-4 h-4" />
                Canlı çeviri aktif · TR ↔ EN
              </div>
              {translateDemo.map((d) => (
                <div key={d.lang} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <span className="text-[10px] font-medium text-muted-foreground">{d.lang}</span>
                  <p className="text-sm font-medium">{d.msg}</p>
                  <p className="text-xs text-primary/90 border-t border-border pt-2 italic">↳ {d.tr}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function SharedInbox() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn delay={0.05}>
            <div className="surface p-6 lg:p-8">
              <div className="flex flex-wrap gap-2 mb-6">
                {channels.map((ch) => (
                  <span key={ch.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    ch.active ? 'bg-primary-light text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    <ch.icon className="w-3.5 h-3.5" />{ch.label}
                    {!ch.active && <span className="text-[10px] opacity-60">(yakında)</span>}
                  </span>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { from: 'Widget', name: 'Ayşe K.', msg: 'Sipariş durumu?', time: '2dk' },
                  { from: 'E-posta', name: 'Mehmet D.', msg: 'Fatura talebi', time: '14dk' },
                  { from: 'WhatsApp', name: 'Zeynep A.', msg: 'İade süreci', time: '1sa' },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary-light text-primary rounded font-medium">{c.from}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.msg}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <span className="section-label mb-4">Birleşik Inbox</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              Sohbetler, müşteriler ve talepler tek yerde
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Widget, WhatsApp, Instagram, Telegram ve e-postayı aynı gelen kutusunda yönetin.
              Masaüstü bildirimleriyle hiçbir isteği kaçırmayın; ziyaretçi profilleri ve geçmiş tek ekranda.
            </p>
            <Link href="/integrations" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              Entegrasyonları incele <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function KnowledgeBaseSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto text-center">
        <FadeIn>
          <span className="section-label mb-4">Bilgi Bankası</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Müşteriler kendi kendine çözsün</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Makaleler, kategoriler ve arama ile self-servis destek merkezi oluşturun.
            Tekrarlayan soruları azaltın, ekibinize zaman kazandırın.
          </p>
        </FadeIn>
        <FadeIn delay={0.1} className="mt-10 max-w-2xl mx-auto">
          <div className="surface p-6 text-left">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg mb-4">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Nasıl yardımcı olabiliriz?</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {['Kurulum rehberi', 'Widget ayarları', 'Fatura & plan', 'API dokümantasyonu'].map((title) => (
                <div key={title} className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary-light/30 transition-colors cursor-default">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">3 makale</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function AiAutomationSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">Otomasyon</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Tekrarlayan işleri otomatikleştirin</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Workflow editörü ile tetikleyici ve aksiyon tabanlı akışlar oluşturun.
              Karşılama mesajları, etiketleme, yönlendirme ve webhook tetikleyicileri.
            </p>
            <ul className="mt-6 space-y-2">
              {['Yeni ziyaretçi karşılama', 'Mesai dışı otomatik yanıt', 'Webhook ile CRM senkronizasyonu'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Workflow className="w-4 h-4 text-primary shrink-0" />{item}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="surface p-6 space-y-4">
              {[
                { trigger: 'Yeni sohbet başladı', action: 'Karşılama mesajı gönder', icon: Zap },
                { trigger: 'Mesai dışı', action: 'Bilgi bankası linki paylaş', icon: Bot },
                { trigger: 'Etiket: acil', action: 'Temsilciye ata + Slack bildir', icon: Workflow },
              ].map((flow) => (
                <div key={flow.trigger} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                  <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <flow.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{flow.trigger}</p>
                    <p className="text-sm font-medium">{flow.action}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function ProductDeepDive() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="section-label mb-4">Ürünler</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">İşletmeniz için modüler çözümler</h2>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.05}>
              <Link href={p.href} className="surface-hover p-5 h-full flex flex-col group">
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{p.desc}</p>
                <span className="text-xs font-medium text-primary mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Detaylar <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function UseCasesTabs() {
  const [active, setActive] = useState('support')
  const current = useCases.find((u) => u.id === active)!

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="section-label mb-4">Kullanım Alanları</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Her ekip için Gu Chat</h2>
          </div>
        </FadeIn>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActive(uc.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                active === uc.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <uc.icon className="w-4 h-4" />{uc.label}
            </button>
          ))}
        </div>
        <FadeIn key={active}>
          <div className="surface p-8 lg:p-10 max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold">{current.title}</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">{current.desc}</p>
            <ul className="mt-6 flex flex-wrap justify-center gap-3">
              {current.bullets.map((b) => (
                <li key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full">
                  <Check className="w-3.5 h-3.5" />{b}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="section-label mb-4">Fiyatlandırma</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Basit, şeffaf fiyatlandırma</h2>
            <p className="mt-3 text-muted-foreground">Gizli ücret yok. İşletmenizin büyüklüğüne uygun paketi seçin.</p>
          </div>
        </FadeIn>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Aylık</span>
          <button onClick={() => setBilling((b) => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-border'}`} aria-label="Fatura dönemi">
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yıllık <span className="ml-1.5 text-[10px] font-bold text-success bg-success-light px-1.5 py-0.5 rounded-full">-20%</span>
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} billing={billing} discount={0.2} idx={i} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Müşterilerimiz ne diyor?</h2>
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
  )
}

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Sık sorulan sorular</h2>
          </div>
        </FadeIn>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="surface overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors">
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${openFaq === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {openFaq === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </div>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FooterCta() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="rounded-2xl bg-gradient-brand px-8 py-14 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Hemen başlayın</h2>
            <p className="mt-3 text-white/80 max-w-md mx-auto">
              Kredi kartı gerekmeden ücretsiz deneyin. Kurulum 30 saniye sürer.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {['KVKK uyumlu', 'Türk yapımı', '7/24 destek'].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />{b}
                </span>
              ))}
            </div>
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
  )
}