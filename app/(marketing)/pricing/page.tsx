'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getMarketingPlanCta, type PlanId } from '@/lib/plan-cta'
import { Check, Minus, ArrowRight, Sparkles, HelpCircle } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { FadeIn } from '@/components/marketing/fade-in'

// ─── Plan definitions ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'FREE',
    name: 'Ücretsiz',
    monthly: 0,
    yearlyMonthly: 0,
    desc: 'Tek girişimciler ve küçük ekipler için. İlk canlı destek deneyiminiz.',
    badge: null,
    highlighted: false,
    color: '#64748B',
  },
  {
    id: 'STARTER',
    name: 'Başlangıç',
    monthly: 1790,
    yearlyMonthly: 1432,
    desc: 'Müşteri hizmetlerini geliştirmek isteyen büyüyen işletmeler için.',
    badge: null,
    highlighted: false,
    color: '#3B82F6',
  },
  {
    id: 'PRO',
    name: 'Profesyonel',
    monthly: 3790,
    yearlyMonthly: 3032,
    desc: 'Tam özellikli destek platformuna ihtiyaç duyan ekipler için. Tüm güçlü özellikler.',
    badge: 'En İyi Değer',
    highlighted: true,
    color: '#1972F5',
  },
  {
    id: 'BUSINESS',
    name: 'Kurumsal',
    monthly: 11990,
    yearlyMonthly: 9592,
    desc: 'Özel entegrasyon, white-label ve garantili SLA isteyen büyük şirketler için.',
    badge: null,
    highlighted: false,
    color: '#7C3AED',
  },
]

// ─── Feature comparison table ────────────────────────────────────────────────

type FeatureValue = boolean | string | null

interface FeatureRow {
  label: string
  tooltip?: string
  free: FeatureValue
  starter: FeatureValue
  pro: FeatureValue
  business: FeatureValue
}

interface FeatureGroup {
  group: string
  rows: FeatureRow[]
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    group: 'Fiyatlandırma',
    rows: [
      { label: 'Aylık fiyat', free: '₺0', starter: '₺1.790', pro: '₺3.790', business: '₺11.990' },
      { label: 'Dahil temsilci', free: '2', starter: '5', pro: '25', business: 'Sınırsız' },
      { label: 'Aylık sohbet limiti', free: '100', starter: '1.000', pro: 'Sınırsız', business: 'Sınırsız' },
    ],
  },
  {
    group: 'Ekip Gelen Kutusu',
    rows: [
      { label: 'Canlı sohbet widget\'ı', free: true, starter: true, pro: true, business: true },
      { label: 'Paylaşımlı gelen kutusu', free: true, starter: true, pro: true, business: true },
      { label: 'Mobil uygulama', free: true, starter: true, pro: true, business: true },
      { label: 'Sınırsız sohbet geçmişi', free: false, starter: true, pro: true, business: true },
      { label: 'Hazır cevaplar', free: false, starter: true, pro: true, business: true },
      { label: 'Dahili notlar', free: false, starter: true, pro: true, business: true },
      { label: 'Sohbet önceliklendirme', free: false, starter: true, pro: true, business: true },
      { label: 'Takip hatırlatıcıları', free: false, starter: true, pro: true, business: true },
      { label: 'Döngüsel yönlendirme', free: false, starter: false, pro: true, business: true },
      { label: 'Yönlendirme kuralları', free: false, starter: false, pro: true, business: true },
    ],
  },
  {
    group: 'Kanallar',
    rows: [
      { label: 'Web sitesi widget\'ı', free: true, starter: true, pro: true, business: true },
      { label: 'E-posta', free: false, starter: true, pro: true, business: true },
      { label: 'WhatsApp Business', free: false, starter: false, pro: true, business: true },
      { label: 'Messenger', free: false, starter: false, pro: true, business: true },
      { label: 'Instagram DM', free: false, starter: false, pro: true, business: true },
      { label: 'Telegram', free: false, starter: false, pro: true, business: true },
    ],
  },
  {
    group: 'Yapay Zeka',
    rows: [
      { label: 'AI otomatik yanıt', free: false, starter: false, pro: true, business: true },
      { label: 'AI temsilci asistanı', free: false, starter: false, pro: true, business: true },
      { label: '50+ dil otomatik çeviri', free: false, starter: false, pro: true, business: true },
      { label: 'Bilgi bankası AI eğitimi', free: false, starter: true, pro: true, business: true },
    ],
  },
  {
    group: 'Sohbet Widget\'ı',
    rows: [
      { label: 'Widget özelleştirme', free: true, starter: true, pro: true, business: true },
      { label: 'Proaktif mesajlar', free: false, starter: true, pro: true, business: true },
      { label: 'Canlı yazma önizleme', free: true, starter: true, pro: true, business: true },
      { label: 'Dosya paylaşımı', free: false, starter: true, pro: true, business: true },
      { label: 'Ekran izleme & müdahale', free: false, starter: false, pro: true, business: true },
      { label: 'Beyaz etiket (filigransız)', free: false, starter: false, pro: false, business: true },
    ],
  },
  {
    group: 'CRM & Ziyaretçi',
    rows: [
      { label: 'Ziyaretçi takibi', free: false, starter: true, pro: true, business: true },
      { label: 'Müşteri profilleri', free: '100', starter: '5.000', pro: '50.000', business: 'Sınırsız' },
      { label: 'Özel nitelikler', free: false, starter: false, pro: true, business: true },
      { label: 'Müşteri segmentasyonu', free: false, starter: false, pro: true, business: true },
    ],
  },
  {
    group: 'Otomasyon & İş Akışı',
    rows: [
      { label: 'Chatbot oluşturucu', free: false, starter: true, pro: true, business: true },
      { label: 'Otomasyon iş akışları', free: false, starter: false, pro: true, business: true },
      { label: 'Kampanya gönderimi', free: false, starter: false, pro: true, business: true },
      { label: 'API & Webhook', free: false, starter: false, pro: true, business: true },
    ],
  },
  {
    group: 'Bilgi Bankası',
    rows: [
      { label: 'Makale & kategoriler', free: false, starter: true, pro: true, business: true },
      { label: 'Widget içi yardım', free: false, starter: true, pro: true, business: true },
      { label: 'Özel alan adı', free: false, starter: false, pro: true, business: true },
      { label: 'Çok dilli destek', free: false, starter: false, pro: true, business: true },
    ],
  },
  {
    group: 'Analitik & Raporlar',
    rows: [
      { label: 'Temel analitik', free: true, starter: true, pro: true, business: true },
      { label: 'Gelişmiş analitik', free: false, starter: false, pro: true, business: true },
      { label: 'Veri dışa aktarma', free: false, starter: true, pro: true, business: true },
      { label: 'Özel panolar', free: false, starter: false, pro: false, business: true },
    ],
  },
  {
    group: 'Güvenlik & SLA',
    rows: [
      { label: 'SSL/TLS şifreleme', free: true, starter: true, pro: true, business: true },
      { label: '2 Faktörlü doğrulama', free: true, starter: true, pro: true, business: true },
      { label: 'KVKK uyumu', free: true, starter: true, pro: true, business: true },
      { label: 'Özel SLA garantisi', free: false, starter: false, pro: false, business: true },
      { label: '7/24 öncelikli destek', free: false, starter: false, pro: false, business: true },
    ],
  },
]

const FAQS = [
  {
    q: 'Bazı özellikler için ekstra ücret öder miyim?',
    a: 'Planınıza dahil olan tüm özellikler aylık fiyata dahildir. Sadece belirli özel entegrasyonlar veya ek temsilci lisansları için ek ücret söz konusu olabilir.',
  },
  {
    q: 'Fiyatlara KDV dahil mi?',
    a: 'Gösterilen fiyatlar KDV hariçtir. Fatura aşamasında geçerli KDV oranı (%20) eklenecektir. Kurumsal mükelleflerin KDV iade süreci için muhasebe ekibinize danışabilirsiniz.',
  },
  {
    q: '14 günlük deneme nasıl çalışır?',
    a: 'Kayıt olduğunuzda seçtiğiniz planın tüm özelliklerine 14 gün boyunca ücretsiz erişim sağlarsınız. Süre sonunda ödeme yapmaz iseniz otomatik olarak Ücretsiz plana geçilir.',
  },
  {
    q: 'İstediğim zaman plan değiştirebilir miyim?',
    a: 'Evet, istediğiniz an yükseltme veya düşürme yapabilirsiniz. Yükseltmelerde kalan süre için kıst hesaplama yapılır. Verileriniz hiçbir zaman silinmez.',
  },
  {
    q: 'Yıllık ödeme yaparsam ne kadar tasarruf ederim?',
    a: 'Yıllık ödeme seçeneğinde %20 indirim uygulanır. Seçtiğiniz planın yıllık tutarını peşin ödeyerek avantajlı fiyattan yararlanabilirsiniz.',
  },
  {
    q: 'Kurumsal plan için nasıl teklif alabilirim?',
    a: 'İletişim formumuzdan bize ulaşın. Özel entegrasyon, white-label, özel SLA ve özel fiyatlandırma için ekibimiz en kısa sürede dönüş yapar.',
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-500" />
      </span>
    )
  }
  if (value === false || value === null) {
    return (
      <span className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-slate-200" />
      </span>
    )
  }
  return <span className="text-sm font-medium text-slate-700 text-center block">{value}</span>
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        {q}
        <span className={`ml-4 flex-shrink-0 w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center transition-transform ${open ? 'rotate-45' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const planCta = (planId: PlanId) => getMarketingPlanCta(planId, { isLoggedIn })

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-white">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="pt-32 pb-16 px-4 sm:px-6 text-center bg-gradient-to-b from-slate-50 to-white">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 mb-6">
              <Sparkles className="w-3 h-3" />
              Her planı 14 gün boyunca ücretsiz deneyin
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Basit, şeffaf fiyatlandırma
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Temsilci başına değil, çalışma alanı başına sabit fiyat.
              Ekibiniz büyüdükçe maliyet artmaz.
            </p>
          </FadeIn>

          {/* Billing toggle */}
          <FadeIn delay={0.15}>
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
                Aylık
              </span>
              <button
                onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-blue-600' : 'bg-slate-200'}`}
                aria-label="Fatura dönemi"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${billing === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                Yıllık
                <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                  %20 indirim
                </span>
              </span>
            </div>
          </FadeIn>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────────────── */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {PLANS.map((plan, i) => {
              const price = billing === 'yearly' ? plan.yearlyMonthly : plan.monthly
              return (
                <FadeIn key={plan.id} delay={i * 0.06}>
                  <div className={`relative h-full rounded-2xl border p-6 flex flex-col transition-all ${
                    plan.highlighted
                      ? 'border-blue-500 shadow-[0_8px_40px_rgba(25,114,245,0.18)] ring-1 ring-blue-500/20'
                      : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}>
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{plan.desc}</p>
                    </div>
                    <div className="mt-6 mb-5">
                      {plan.monthly === 0 ? (
                        <div>
                          <span className="text-3xl font-bold text-slate-900">Ücretsiz</span>
                          <p className="text-xs text-slate-400 mt-1">Sonsuza dek</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-slate-900">₺{price.toLocaleString('tr-TR')}</span>
                            <span className="text-sm text-slate-400">/ay</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {billing === 'yearly'
                              ? `Yıllık ₺${(price * 12).toLocaleString('tr-TR')} · %20 indirimli`
                              : 'Çalışma alanı başına'}
                          </p>
                        </div>
                      )}
                    </div>
                    <Link
                      href={planCta(plan.id as PlanId).href}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all ${
                        plan.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {planCta(plan.id as PlanId).label}
                    </Link>
                    {plan.monthly > 0 && (
                      <p className="text-[10px] text-slate-400 text-center mt-2">
                        Kredi kartı gerekmez · İstediğinde iptal
                      </p>
                    )}
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </section>

        {/* ── Flat pricing callout ─────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Temsilci başına değil, çalışma alanı başına sabit fiyat</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Ekibinize kaç kişi eklerseniz ekleyin, aylık ücretiniz değişmez.
                  Büyürken ekstra maliyet endişesi taşımadan işinize odaklanın.
                </p>
              </div>
              <Link href="/register" className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </FadeIn>

        {/* ── Feature comparison table ─────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">Planları karşılaştırın</h2>
              <p className="text-slate-500 text-center text-sm mb-10">Şirketinize en uygun planı seçin.</p>
            </FadeIn>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 font-semibold text-slate-600 w-[40%]">Özellik</th>
                    {PLANS.map(plan => (
                      <th key={plan.id} className={`text-center px-4 py-4 font-bold ${plan.highlighted ? 'text-blue-600' : 'text-slate-700'}`}>
                        <div>{plan.name}</div>
                        <div className={`text-xs font-normal mt-0.5 ${plan.highlighted ? 'text-blue-400' : 'text-slate-400'}`}>
                          {plan.monthly === 0 ? '₺0' : `₺${plan.monthly.toLocaleString('tr-TR')}/ay`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_GROUPS.map((group) => (
                    <>
                      <tr key={group.group} className="bg-slate-50/60">
                        <td colSpan={5} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {group.group}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-700 font-medium flex items-center gap-1.5">
                            {row.label}
                            {row.tooltip && (
                              <span title={row.tooltip}>
                                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.free} /></td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.starter} /></td>
                          <td className={`px-4 py-3.5 text-center ${PLANS[2].highlighted ? 'bg-blue-50/40' : ''}`}>
                            <FeatureCell value={row.pro} />
                          </td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.business} /></td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-5 py-4" />
                    {PLANS.map(plan => (
                      <td key={plan.id} className="px-4 py-4 text-center">
                        <Link
                          href={planCta(plan.id as PlanId).href}
                          className={`inline-block text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                            plan.highlighted
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {planCta(plan.id as PlanId).label}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ── Enterprise callout ───────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-8 sm:p-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Kurumsal</span>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Daha özel bir şeye mi ihtiyacınız var?</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Özel entegrasyon, white-label, kişiselleştirilmiş SLA ve ekip eğitimi için kurumsal paketimizi keşfedin.
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {['Özel onboarding programı', 'Kişiselleştirilmiş SLA', 'Özel özellik geliştirme', 'Benzersiz fiyatlandırma', 'Ekip eğitimi & danışmanlık'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/contact"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20"
                >
                  İletişime Geç <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">Sık sorulan sorular</h2>
            </FadeIn>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <FadeIn key={i} delay={i * 0.04}>
                  <FaqItem
                    q={faq.q}
                    a={faq.a}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-20 px-4 sm:px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Müşteri deneyiminizi geliştirmeye hazır mısınız?</h2>
              <p className="text-slate-500 mb-8">14 gün ücretsiz deneyin. Taahhüt yok, kredi kartı gerekmez.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 text-sm">
                  Ücretsiz Başla <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                  İletişime Geç
                </Link>
              </div>
            </div>
          </section>
        </FadeIn>

      </main>
      <MarketingFooter />
    </>
  )
}
