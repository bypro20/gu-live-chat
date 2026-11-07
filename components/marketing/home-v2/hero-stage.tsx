'use client'

import { useEffect, useState } from 'react'
import { Eye, Check, MousePointer2 } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { usePrefersReducedMotion } from '@/components/marketing/home-v2/use-reduced-motion'

/**
 * Hero "tiyatro": tek bir satış anının canlı simülasyonu.
 * Ziyaretçi ödeme adımında tereddüt eder → temsilci görür → yazar → sipariş tamamlanır.
 * Örnek senaryodur; sahte müşteri verisi/rakam içermez.
 */

const STEP_MS = [1500, 2200, 1800, 2000, 1700, 2600]

const COPY = {
  tr: {
    scenario: 'Örnek senaryo',
    store: 'atolyemavi.com',
    product: 'El yapımı seramik set',
    price: '1.249 ₺',
    shipping: 'Kargo',
    shippingFee: '89,90 ₺',
    total: 'Toplam',
    pay: 'Ödemeye geç',
    done: 'Sipariş alındı',
    agentName: 'Elif · Müşteri deneyimi',
    agentMsg: 'Merhaba! Bu siparişte kargoyu bizden olsun diye ayarladım, devam edebilirsiniz.',
    visitorMsg: 'Çok iyi oldu, teşekkürler.',
    typing: 'yazıyor',
    visitor: 'Ziyaretçi · İzmir',
    onStep: 'Ödeme adımında 14 sn',
    hesitate: 'Tereddüt algılandı',
    watch: 'Canlı ekran',
    reply: 'Yanıt yaz…',
  },
  en: {
    scenario: 'Example scenario',
    store: 'blueworkshop.com',
    product: 'Handmade ceramic set',
    price: '$74.00',
    shipping: 'Shipping',
    shippingFee: '$5.40',
    total: 'Total',
    pay: 'Continue to payment',
    done: 'Order received',
    agentName: 'Elif · Customer care',
    agentMsg: 'Hi! I just made shipping free on this order — you can go ahead.',
    visitorMsg: 'That is great, thank you.',
    typing: 'typing',
    visitor: 'Visitor · London',
    onStep: '14s on payment step',
    hesitate: 'Hesitation detected',
    watch: 'Live screen',
    reply: 'Write a reply…',
  },
}

// İmleç konumları (kutu içi % olarak)
const CURSOR: Array<{ x: number; y: number }> = [
  { x: 28, y: 36 },
  { x: 70, y: 58 },
  { x: 64, y: 61 },
  { x: 66, y: 62 },
  { x: 60, y: 82 },
  { x: 60, y: 82 },
]

export function HeroStage() {
  const { locale } = useLocale()
  const c = locale === 'en' ? COPY.en : COPY.tr
  const reduced = usePrefersReducedMotion()
  const [loopStep, setStep] = useState(0)
  const step = reduced ? 5 : loopStep

  useEffect(() => {
    if (reduced) return
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      t = setTimeout(() => {
        i = (i + 1) % STEP_MS.length
        setStep(i)
        tick()
      }, STEP_MS[i])
    }
    tick()
    return () => clearTimeout(t)
  }, [reduced])

  const cur = CURSOR[step]
  const showAgentCard = step >= 2
  const showTypingAgent = step === 3
  const showAgentMsg = step >= 4
  const showVisitorMsg = step >= 5
  const done = step === 5

  return (
    <div className="relative mx-auto w-full max-w-[1080px]" aria-hidden="true">
      {/* Işık */}
      <div className="absolute -inset-x-10 -top-10 bottom-0 hv2-stage-glow" />

      <div className="relative rounded-2xl border border-white/10 bg-[#0d0b16]/80 shadow-[0_40px_120px_-30px_rgba(124,58,237,0.55)] backdrop-blur-sm">
        {/* Tarayıcı çubuğu */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            {c.store}
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
            {c.scenario}
          </span>
        </div>

        {/* Mağaza sayfası */}
        <div className="relative grid min-h-[360px] grid-cols-1 gap-6 p-5 sm:min-h-[460px] sm:grid-cols-[1.1fr_1fr] sm:p-8">
          <div className="hidden sm:block">
            <div className="h-full min-h-[230px] overflow-hidden sm:max-h-[330px] rounded-xl bg-gradient-to-br from-[#2a2347] via-[#1b1730] to-[#2b1d3a] p-6">
              <div className="grid h-full grid-cols-3 grid-rows-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="rounded-lg"
                    style={{
                      background: `linear-gradient(${140 + n * 20}deg, rgba(167,139,250,${0.18 + (n % 3) * 0.07}), rgba(45,212,191,${0.08 + (n % 2) * 0.08}))`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-start sm:justify-center sm:pb-[170px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{c.product}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>{c.product}</span>
                <span>{c.price}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span className={step >= 1 && step < 4 ? 'text-amber-300' : ''}>{c.shipping}</span>
                <span className={step >= 4 ? 'text-emerald-300 line-through decoration-emerald-300/60' : step >= 1 ? 'text-amber-300' : ''}>
                  {c.shippingFee}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 font-semibold text-white">
                <span>{c.total}</span>
                <span>{step >= 4 ? c.price : c.price + ' + ' + c.shippingFee}</span>
              </div>
            </div>
            <button
              type="button"
              tabIndex={-1}
              className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors duration-500 ${
                done ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-[#0d0b16]'
              }`}
            >
              {done ? (
                <>
                  <Check className="h-4 w-4" /> {c.done}
                </>
              ) : (
                c.pay
              )}
            </button>
          </div>

          {/* İmleç */}
          {!reduced && (
            <div
              className="pointer-events-none absolute z-20 transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: `${cur.x}%`, top: `${cur.y}%` }}
            >
              <MousePointer2 className="h-5 w-5 fill-white text-[#0d0b16] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
              {step === 1 && <span className="absolute -inset-2 animate-ping rounded-full border border-amber-300/50" />}
            </div>
          )}

          {/* Sohbet balonu — ziyaretçi tarafı */}
          <div className="z-10 mt-2 w-full sm:absolute sm:bottom-6 sm:right-6 sm:mt-0 sm:w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-[#161226]/95 p-3 shadow-xl">
              <div className="mb-2 flex items-center gap-2 border-b border-white/[0.07] pb-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-teal-300 text-[10px] font-bold text-[#0d0b16]">
                  E
                </span>
                <span className="text-[11px] font-medium text-white/80">{c.agentName}</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="min-h-[92px] space-y-2 text-[12px] leading-snug">
                {showTypingAgent && (
                  <div className="inline-flex items-center gap-1 rounded-xl rounded-bl-sm bg-white/[0.07] px-3 py-2 text-white/50">
                    <span className="hv2-dot" />
                    <span className="hv2-dot [animation-delay:150ms]" />
                    <span className="hv2-dot [animation-delay:300ms]" />
                  </div>
                )}
                {showAgentMsg && (
                  <div className="hv2-pop max-w-[92%] rounded-xl rounded-bl-sm bg-white/[0.08] px-3 py-2 text-white/85">
                    {c.agentMsg}
                  </div>
                )}
                {showVisitorMsg && (
                  <div className="hv2-pop ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-violet-500/80 px-3 py-2 text-white">
                    {c.visitorMsg}
                  </div>
                )}
              </div>
              <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/30">{c.reply}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Temsilci paneli — ziyaretçi bilgisi */}
      <div
        className={`relative z-30 mx-3 -mt-2 rounded-xl sm:absolute sm:-bottom-6 sm:left-[-18px] sm:mx-0 sm:mt-0 sm:w-[270px] rounded-xl border border-white/10 bg-[#120f20]/95 p-4 shadow-2xl backdrop-blur transition-all duration-700 ${
          showAgentCard ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>{c.visitor}</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {c.watch}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-white">{c.onStep}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] font-medium text-amber-200">
            <Eye className="h-3 w-3" /> {c.hesitate}
          </span>
        </div>
      </div>
    </div>
  )
}
