'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, CreditCard, Copy, MessageCircle, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'

export const MICRO_DEMO_COPY = {
  tr: {
    howItWorks: 'Nasıl çalışır?',
    widget: {
      title: 'Tek satır kod, anında canlı sohbet',
      description: 'Widget kodunu kopyalayın, sitenize yapıştırın. Dakikalar içinde ziyaretçileriniz sizinle konuşmaya başlasın — kurulum 30 saniye sürer.',
    },
    payment: {
      title: 'Plan seçin, iyzico ile güvenle ödeyin',
      description: 'PRO veya Business planını seçin; kart bilgileriniz iyzico altyapısıyla korunur. Ödeme sonrası plan anında aktif olur, fatura e-postanıza gelir.',
    },
    analytics: {
      title: 'Her ziyaretçiyi, her dönüşümü takip edin',
      description: 'Gerçek zamanlı analitik paneliyle hangi sayfaların sohbet başlattığını, dönüşüm oranlarını ve ekip performansını görün.',
    },
  },
  en: {
    howItWorks: 'How it works',
    widget: {
      title: 'One line of code, live chat instantly',
      description: 'Copy the widget snippet, paste it on your site. Visitors can start chatting with you in minutes — setup takes 30 seconds.',
    },
    payment: {
      title: 'Pick a plan, pay securely with iyzico',
      description: 'Choose PRO or Business — card details are protected by iyzico. Your plan activates immediately and the invoice lands in your inbox.',
    },
    analytics: {
      title: 'Track every visitor and conversion',
      description: 'See which pages drive chats, monitor conversion rates, and review team performance from your real-time analytics dashboard.',
    },
  },
} as const

function useSteps(count: number, ms = 2800) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % count), ms)
    return () => window.clearInterval(id)
  }, [count, ms])
  return step
}

/** Hero kalitesinde büyük tarayıcı mockup */
function DemoChrome({ url, children, className = '' }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[520px] rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden ${className}`}
    >
      <div className="absolute -inset-6 bg-gradient-to-br from-indigo-500/12 via-violet-500/8 to-cyan-400/8 rounded-3xl blur-2xl pointer-events-none -z-10" />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/90">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 flex justify-center min-w-0">
          <div className="px-4 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 font-medium truncate max-w-full">
            {url}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

/** Plan seç → iyzico kart → ödeme başarılı */
export function PaymentFlowShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(4)
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className={`relative w-full ${className}`}>
      <DemoChrome url="gulivechat.com/settings/billing">
        <div className="p-5 sm:p-6 min-h-[300px] space-y-3">
          <div
            className={`rounded-xl border p-4 transition-all duration-500 ${
              step === 0 ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200/60' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <p className="text-sm font-bold text-slate-800">PRO Plan · {isTr ? 'Aylık' : 'Monthly'}</p>
            <p className="text-xs text-slate-500 mt-1">{isTr ? '2.000 sohbet · 500 site' : '2,000 chats · 500 sites'}</p>
            <p className="text-lg font-extrabold text-indigo-600 mt-2">₺3.790<span className="text-xs font-medium text-slate-400">/ay</span></p>
          </div>

          <div
            className={`rounded-xl border border-slate-200 p-4 transition-all duration-500 ${
              step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 h-0 overflow-hidden p-0 border-0'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">
                {isTr ? 'iyzico güvenli ödeme' : 'iyzico secure checkout'}
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="h-10 rounded-lg bg-slate-50 border border-slate-200 px-3 flex items-center text-sm text-slate-500 font-mono tracking-wider">
                •••• •••• •••• 4242
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-10 rounded-lg bg-slate-50 border border-slate-200 px-3 flex items-center text-sm text-slate-600">
                  12/28
                </div>
                <div className="h-10 rounded-lg bg-slate-50 border border-slate-200 px-3 flex items-center text-sm text-slate-400">
                  CVV •••
                </div>
              </div>
              <div className="h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
                {isTr ? 'Ödemeyi tamamla' : 'Complete payment'}
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 transition-all duration-500 ${
              step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden p-0 border-0'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">{isTr ? 'Ödeme başarılı!' : 'Payment successful!'}</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {isTr ? 'PRO plan aktif · Fatura e-postanızda' : 'PRO plan active · Invoice sent to your email'}
              </p>
            </div>
          </div>

          <p
            className={`text-xs text-center text-slate-400 transition-opacity duration-500 ${
              step >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isTr ? '7 gün ücretsiz deneme · İstediğiniz zaman iptal' : '7-day free trial · Cancel anytime'}
          </p>
        </div>
      </DemoChrome>
    </div>
  )
}

/** Kod kopyala → siteye widget eklenir */
export function WidgetInstallShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(3, 2600)
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className={`relative w-full ${className}`}>
      <DemoChrome url="gulivechat.com/settings/widget">
        <div className="p-5 sm:p-6 min-h-[300px]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {isTr ? 'Widget kodu' : 'Widget code'}
          </p>
          <div className="rounded-xl bg-slate-900 p-4 mb-4 relative">
            <code className="text-xs sm:text-sm text-emerald-400 leading-relaxed block font-mono whitespace-pre-wrap">
              {`window.$gu = window.$gu || function() {
  (window.$gu.q = window.$gu.q || []).push(arguments);
};
window.GU_WIDGET_URL = 'https://www.gulivechat.com';
$gu('set', 'WEBSITE_ID', 'YOUR_ID');`}
            </code>
            <code className="text-xs sm:text-slate-400 block font-mono mt-2">
              {'<script async src="https://www.gulivechat.com/widget.js"></script>'}
            </code>
            <div
              className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 transition-all duration-500 ${
                step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              <Copy className="w-4 h-4 text-white" />
              <span className="text-xs font-semibold text-white">{isTr ? 'Kopyalandı' : 'Copied'}</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {isTr ? 'Sitenizde' : 'On your site'}
          </p>
          <div className="relative h-36 sm:h-40 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 overflow-hidden">
            <div className="p-4 space-y-2.5">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-2.5 w-40 bg-slate-100 rounded" />
              <div className="h-2.5 w-32 bg-slate-100 rounded" />
              <div className="grid grid-cols-3 gap-2 mt-4 max-w-[200px]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-lg bg-slate-100 border border-slate-100" />
                ))}
              </div>
            </div>
            <div
              className={`absolute bottom-4 right-4 transition-all duration-700 ${
                step >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/40 animate-pulse">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-[10px] text-center text-indigo-600 font-semibold mt-1.5">
                {isTr ? 'Canlı sohbet hazır' : 'Live chat ready'}
              </p>
            </div>
          </div>
        </div>
      </DemoChrome>
    </div>
  )
}

/** Ekip gelen kutusu */
export function InboxFlowShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(4, 2800)
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className={`relative w-full ${className}`}>
      <DemoChrome url="app.gulivechat.com/inbox">
        <div className="flex min-h-[300px]">
          <div className="w-24 sm:w-28 border-r border-slate-100 bg-slate-50 p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-12 rounded-lg transition-all duration-500 ${
                  i === 1 && step >= 1
                    ? 'bg-indigo-100 border-2 border-indigo-300 shadow-sm'
                    : 'bg-white border border-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex-1 p-4 flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-violet-500 text-sm text-white flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800">Ayşe K.</span>
                <p className="text-xs text-slate-400">{isTr ? 'E-ticaret sitesi' : 'E-commerce site'}</p>
              </div>
              <span
                className={`ml-auto text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold transition-all duration-500 ${
                  step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                {isTr ? 'Yeni' : 'New'}
              </span>
            </div>
            <div className="flex-1 space-y-3 py-2">
              <div
                className={`rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 max-w-[85%] transition-all duration-500 ${
                  step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
                }`}
              >
                <p className="text-sm text-slate-700">{isTr ? 'Kargo ne zaman gelir?' : 'When will my order arrive?'}</p>
              </div>
              <div
                className={`rounded-2xl rounded-tr-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 max-w-[88%] ml-auto shadow-md transition-all duration-500 ${
                  step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
                }`}
              >
                <p className="text-sm text-white">{isTr ? 'Bugün kargoya verildi ✓' : 'Shipped today ✓'}</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 pt-2 border-t border-slate-100 transition-opacity duration-500 ${
                step >= 3 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">
                {isTr ? 'Okundu · Müşteri memnun' : 'Read · Customer satisfied'}
              </span>
            </div>
          </div>
        </div>
      </DemoChrome>
    </div>
  )
}

/** AI otomatik yanıt */
export function AiReplyShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(3, 2800)
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className={`relative w-full ${className}`}>
      <DemoChrome url="Gu Live Chat · AI">
        <div className="p-5 sm:p-6 min-h-[300px] space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">
              {isTr ? 'AI Asistan aktif — 7/24 yanıt' : 'AI Assistant active — 24/7 replies'}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 max-w-[85%]">
            <p className="text-sm text-slate-700">{isTr ? 'İade politikanız nedir?' : 'What is your return policy?'}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-violet-50 border border-violet-200 px-4 py-3 max-w-[88%] min-h-[52px] flex items-center">
              {step >= 2 ? (
                <p className="text-sm text-violet-900 leading-relaxed">
                  {isTr
                    ? '14 gün içinde koşulsuz iade yapabilirsiniz. Detaylar sitemizde →'
                    : 'You can return within 14 days, no questions asked. Details on our site →'}
                </p>
              ) : (
                <div className="flex gap-1.5 py-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <p
            className={`text-xs text-slate-400 text-center transition-opacity duration-500 ${
              step >= 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isTr ? 'Bilgi bankasından öğrenir · Gerekirse temsilciye aktarır' : 'Learns from knowledge base · Escalates when needed'}
          </p>
        </div>
      </DemoChrome>
    </div>
  )
}

/** Analitik */
export function AnalyticsShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(5, 2400)
  const bars = [40, 55, 45, 70, step >= 4 ? 85 : 60]
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className={`relative w-full ${className}`}>
      <DemoChrome url="gulivechat.com/analytics">
        <div className="p-5 sm:p-6 min-h-[300px]">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                {isTr ? 'Ziyaretçi' : 'Visitors'}
              </p>
              <p className="text-2xl font-extrabold text-indigo-900 mt-1">{step >= 2 ? '1.284' : '892'}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
                {isTr ? 'Dönüşüm' : 'Conversion'}
              </p>
              <p className="text-2xl font-extrabold text-emerald-900 flex items-center gap-1 mt-1">
                {step >= 3 ? '12.4%' : '8.1%'}
                {step >= 3 && <TrendingUp className="w-5 h-5" />}
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-2">{isTr ? 'Son 7 gün' : 'Last 7 days'}</p>
          <div className="flex items-end gap-2 h-28 px-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400 transition-all duration-700"
                style={{ height: `${h}%`, opacity: step >= i ? 1 : 0.25 }}
              />
            ))}
          </div>
        </div>
      </DemoChrome>
    </div>
  )
}

/** Otomasyon akışı */
export function AutomationShowcase({ className = '' }: { className?: string }) {
  const step = useSteps(3, 2600)
  const { locale } = useLocale()
  const isTr = locale !== 'en'
  const items = [
    { icon: Zap, label: isTr ? 'Sayfa 30 sn açık kaldı' : 'Page open for 30 seconds' },
    { icon: MessageCircle, label: isTr ? 'Proaktif mesaj gönder' : 'Send proactive message' },
    { icon: Check, label: isTr ? 'Sohbet başlatıldı' : 'Chat started' },
  ]

  return (
    <div className={`relative w-full max-w-[520px] ${className}`}>
      <div className="absolute -inset-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-3xl blur-2xl pointer-events-none -z-10" />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 p-5 sm:p-6 space-y-1 min-h-[300px] flex flex-col justify-center">
        {items.map(({ icon: Icon, label }, i) => (
          <div key={label}>
            {i > 0 && <div className="ml-7 border-l-2 border-dashed border-indigo-300 h-4" />}
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border transition-all duration-500 ${
                step >= i
                  ? 'border-indigo-300 bg-indigo-50 shadow-sm scale-100'
                  : 'border-slate-200 bg-slate-50 opacity-40 scale-[0.98]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-800">{label}</span>
              {step >= i && step > i && (
                <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Bölüm arası bilgilendirme şeridi — demo ön planda */
export function MicroDemoStrip({
  title,
  description,
  children,
  reverse = false,
  label,
}: {
  title: string
  description: string
  children: ReactNode
  reverse?: boolean
  label?: string
}) {
  const { locale } = useLocale()
  const copy = MICRO_DEMO_COPY[locale === 'en' ? 'en' : 'tr']

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-100 bg-gradient-to-br from-slate-50/90 via-white to-indigo-50/40 overflow-hidden">
      <div
        className={`max-w-6xl mx-auto grid gap-10 lg:gap-16 items-center ${
          reverse ? 'lg:grid-cols-[1fr_1.1fr]' : 'lg:grid-cols-[1.1fr_1fr]'
        }`}
      >
        <div className={`flex justify-center ${reverse ? 'lg:order-2' : 'lg:order-1'}`}>{children}</div>
        <div className={`text-center lg:text-left ${reverse ? 'lg:order-1' : 'lg:order-2'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">
            {label ?? copy.howItWorks}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{title}</h3>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  )
}

export function WidgetInstallStrip() {
  const { locale } = useLocale()
  const c = MICRO_DEMO_COPY[locale === 'en' ? 'en' : 'tr'].widget
  return (
    <MicroDemoStrip title={c.title} description={c.description}>
      <WidgetInstallShowcase />
    </MicroDemoStrip>
  )
}

export function PaymentFlowStrip({ reverse = false }: { reverse?: boolean }) {
  const { locale } = useLocale()
  const c = MICRO_DEMO_COPY[locale === 'en' ? 'en' : 'tr'].payment
  return (
    <MicroDemoStrip title={c.title} description={c.description} reverse={reverse}>
      <PaymentFlowShowcase />
    </MicroDemoStrip>
  )
}

export function AnalyticsStrip() {
  const { locale } = useLocale()
  const c = MICRO_DEMO_COPY[locale === 'en' ? 'en' : 'tr'].analytics
  return (
    <MicroDemoStrip title={c.title} description={c.description} reverse>
      <AnalyticsShowcase />
    </MicroDemoStrip>
  )
}
