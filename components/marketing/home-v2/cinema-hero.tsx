'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Unbounded } from 'next/font/google'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { usePrefersReducedMotion } from '@/components/marketing/home-v2/use-reduced-motion'
import { Starfield } from '@/components/marketing/home-v2/fx'
import { Smoke } from '@/components/marketing/home-v2/smoke'

const display = Unbounded({ subsets: ['latin', 'latin-ext'], weight: ['600', '800'] })

const CHANNELS = [
  { id: 'web', hue: 0, tr: 'Web sitesi', en: 'Website', msgTr: 'Bu ürün stokta var mı?', msgEn: 'Is this item in stock?' },
  { id: 'wa', hue: 28, tr: 'WhatsApp', en: 'WhatsApp', msgTr: 'Yarın için randevu alabilir miyim?', msgEn: 'Can I book for tomorrow?' },
  { id: 'tg', hue: -22, tr: 'Telegram', en: 'Telegram', msgTr: 'Fiyat listesini alabilir miyim?', msgEn: 'Could I get the price list?' },
  { id: 'ms', hue: -38, tr: 'Messenger', en: 'Messenger', msgTr: 'Kargom nerede?', msgEn: 'Where is my order?' },
  { id: 'ig', hue: 42, tr: 'Instagram', en: 'Instagram', msgTr: 'Bu modelin mavisi var mı?', msgEn: 'Does this come in blue?' },
  { id: 'li', hue: -48, tr: 'LinkedIn', en: 'LinkedIn', msgTr: 'Kurumsal teklif alabilir miyiz?', msgEn: 'Can we get a business quote?' },
  { id: 'sms', hue: 14, tr: 'SMS', en: 'SMS', msgTr: 'Randevumu değiştirebilir miyim?', msgEn: 'Can I change my appointment?' },
]

const COPY = {
  tr: {
    sub: 'Müşterileriniz nerede yazarsa yazsın, cevap tek yerden.',
    tap: 'Bir kanal seçin.',
    tap2: 'Cevap hep tek gelen kutusunda.',
    start: 'Ücretsiz başla',
    demo: 'Canlı demoyu gör',
    ai: 'Yapay zekâ yanıtlıyor',
    scroll: 'Aşağı kaydırın',
  },
  en: {
    sub: 'Wherever your customers write, the answer comes from one place.',
    tap: 'Pick a channel.',
    tap2: 'Every reply lives in one inbox.',
    start: 'Start free',
    demo: 'See the live demo',
    ai: 'AI is replying',
    scroll: 'Scroll down',
  },
}

export function CinemaHero() {
  const { locale } = useLocale()
  const en = locale === 'en'
  const c = en ? COPY.en : COPY.tr
  const reduced = usePrefersReducedMotion()
  const orbRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(1)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    if (reduced || manual) return
    const t = setInterval(() => setIdx((i) => (i + 1) % CHANNELS.length), 3800)
    return () => clearInterval(t)
  }, [reduced, manual])

  const ch = CHANNELS[idx]
  const onLeft = idx % 2 === 0

  return (
    <section className="hv2 cin relative isolate flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#04070d] px-4 pb-12 pt-28 text-white">
      <div className="cin-nebula" aria-hidden="true">
        <span className="cin-cloud cin-cloud-a" />
        <span className="cin-cloud cin-cloud-b" />
        <span className="cin-cloud cin-cloud-c" />
      </div>
      <Starfield count={140} />
      <div className="cin-rings" aria-hidden="true">
        <span className="cin-ring cin-ring-1" />
        <span className="cin-ring cin-ring-2" />
        <span className="cin-ring cin-ring-3" />
      </div>

      <h1 className={`${display.className} cin-word relative z-10 text-center text-[2.1rem] font-extrabold leading-[1.02] tracking-[0.04em] sm:text-6xl lg:text-[5.4rem]`}>
        <span className="block">GU LIVE</span>
        <span className="block cin-word-b">CHAT</span>
      </h1>
      <p className="relative z-10 mt-5 max-w-md text-balance text-center text-[15px] leading-relaxed text-cyan-50/70 sm:text-lg">{c.sub}</p>

      <div className="relative z-10 mt-8 flex w-full flex-1 items-center justify-center sm:mt-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,#000_62%,transparent)]" aria-hidden="true">
          <Smoke targetRef={orbRef} hue={188} radius={170} level={0.9} />
        </div>

        {/* mesaj balonu */}
        <div
          key={ch.id}
          className={`cin-bubble absolute top-[8%] z-20 hidden w-[230px] sm:block ${onLeft ? 'left-[calc(50%-390px)]' : 'right-[calc(50%-390px)]'}`}
        >
          <div className="rounded-2xl rounded-bl-md border border-white/12 bg-white/[0.07] px-4 py-3 text-[13px] leading-snug text-white/90 backdrop-blur-md">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {en ? ch.en : ch.tr}
            </span>
            {en ? ch.msgEn : ch.msgTr}
          </div>
          <div className="mt-2 ml-6 inline-flex items-center gap-1.5 rounded-full bg-cyan-300/12 px-3 py-1 text-[10px] font-medium text-cyan-100/80">
            <span className="cin-typing"><i /><i /><i /></span>
            {c.ai}
          </div>
        </div>

        <div className="cin-orb-wrap">
          <div ref={orbRef} className="cin-orb" style={{ filter: `hue-rotate(${ch.hue}deg)` }}>
            <span className="cin-orb-shine" />
            <MessageCircle className="relative z-10 h-12 w-12 fill-white/90 text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,.35)] sm:h-14 sm:w-14" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <ul className="relative z-10 mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2" role="tablist" aria-label={en ? 'Channels' : 'Kanallar'}>
        {CHANNELS.map((x, i) => (
          <li key={x.id}>
            <button
              role="tab"
              aria-selected={i === idx}
              onClick={() => {
                setManual(true)
                setIdx(i)
              }}
              className={`rounded-full border px-4 py-1.5 text-[13px] transition ${
                i === idx
                  ? 'border-cyan-200/70 bg-cyan-200/15 text-white shadow-[0_0_24px_-4px_rgba(103,232,249,.7)]'
                  : 'border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {en ? x.en : x.tr}
            </button>
          </li>
        ))}
      </ul>

      <p className="relative z-10 mt-7 text-center text-xl font-semibold tracking-tight sm:text-2xl">
        {c.tap} <span className="text-cyan-200">{c.tap2}</span>
      </p>

      <div className="relative z-10 mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/register" className="hv2-btn hv2-btn-glow inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#04070d] transition hover:bg-white/90">
          {c.start} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/demo" className="inline-flex items-center rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.07]">
          {c.demo}
        </Link>
      </div>

      <span className="cin-scroll relative z-10 mt-8 text-[11px] uppercase tracking-[0.3em] text-white/35">{c.scroll}</span>
    </section>
  )
}
