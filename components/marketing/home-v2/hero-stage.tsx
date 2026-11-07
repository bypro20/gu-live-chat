'use client'

import { useEffect, useState } from 'react'
import { Eye, Inbox, Users, BookOpen, BarChart3, Bot, Globe, Smartphone, Send } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { usePrefersReducedMotion } from '@/components/marketing/home-v2/use-reduced-motion'

/**
 * Hero: Gu Live Chat gelen kutusunun canlı simülasyonu.
 * Ziyaretçi yazar → yapay zekâ yanıtlar → ekip devralır.
 * Örnek ekrandır; gerçek müşteri verisi içermez.
 */

const STEP_MS = [1400, 1500, 2200, 1800, 2000, 2800]

const COPY = {
  tr: {
    example: 'Örnek ekran',
    nav: ['Gelen kutusu', 'Ziyaretçiler', 'Bilgi bankası', 'Analitik', 'Sohbet botu'],
    list: [
      { n: 'Selin K.', m: 'Kargom ne zaman gelir?', c: 'Web', col: 'bg-violet-400' },
      { n: 'Mert A.', m: 'Fatura gönderebilir misiniz?', c: 'WhatsApp', col: 'bg-emerald-400' },
      { n: 'Deniz T.', m: 'Fiyat listesini alabilir miyim', c: 'Telegram', col: 'bg-sky-400' },
      { n: 'Ayşe B.', m: 'İade koşullarınız nedir?', c: 'Messenger', col: 'bg-blue-400' },
    ],
    v1: 'Merhaba, siparişim ne zaman kargolanır? Cumartesiye lazım.',
    a1: 'Siparişler aynı gün kargolanır, İstanbul içi ertesi gün teslim edilir. Bugün 16:00’dan önce verirseniz cumartesi elinizde.',
    v2: 'Teşekkürler. Teslimat adresini değiştirmem gerekiyor.',
    handoff: 'Adres değişikliği için sohbet ekibe aktarıldı',
    h1: 'Elif devraldı',
    r1: 'Merhaba Selin Hanım, adresi şimdi güncelliyorum. Yeni adresi yazar mısınız?',
    ai: 'AI',
    team: 'Ekip',
    visitor: 'Ziyaretçi',
    loc: 'İzmir · Chrome · macOS',
    now: 'Şu an',
    page: '/urunler/seramik-set',
    history: '4 sayfa görüntüledi',
    watch: 'Ekranı izle',
    widgetName: 'Gu Live Chat',
    widgetOn: 'Çevrimiçi',
    reply: 'Yanıt yaz…',
    open: 'Açık',
    mobile: 'Mobil uygulama',
    url: 'gulivechat.com / gelen-kutusu',
  },
  en: {
    example: 'Example screen',
    nav: ['Inbox', 'Visitors', 'Knowledge base', 'Analytics', 'Chatbot'],
    list: [
      { n: 'Selin K.', m: 'When will my order ship?', c: 'Web', col: 'bg-violet-400' },
      { n: 'Mert A.', m: 'Can you send the invoice?', c: 'WhatsApp', col: 'bg-emerald-400' },
      { n: 'Deniz T.', m: 'Could I get the price list', c: 'Telegram', col: 'bg-sky-400' },
      { n: 'Ayşe B.', m: 'What is your return policy?', c: 'Messenger', col: 'bg-blue-400' },
    ],
    v1: 'Hi, when will my order ship? I need it by Saturday.',
    a1: 'Orders ship the same day and arrive next day inside the city. Order before 4 PM today and you will have it Saturday.',
    v2: 'Thanks. I need to change the delivery address.',
    handoff: 'Chat passed to the team for an address change',
    h1: 'Elif took over',
    r1: 'Hi Selin, I am updating it now. Could you type the new address?',
    ai: 'AI',
    team: 'Team',
    visitor: 'Visitor',
    loc: 'London · Chrome · macOS',
    now: 'Now on',
    page: '/products/ceramic-set',
    history: 'Viewed 4 pages',
    watch: 'Watch screen',
    widgetName: 'Gu Live Chat',
    widgetOn: 'Online',
    reply: 'Write a reply…',
    open: 'Open',
    mobile: 'Mobile app',
    url: 'gulivechat.com / inbox',
  },
}

const NAV_ICONS = [Inbox, Users, BookOpen, BarChart3, Bot]

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

  const typing = step === 1
  const showA1 = step >= 2
  const showV2 = step >= 3
  const showHandoff = step >= 4
  const showR1 = step >= 5

  return (
    <div className="relative mx-auto w-full max-w-[1100px]" aria-hidden="true">
      <div className="absolute -inset-x-10 -top-10 bottom-0 hv2-stage-glow" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08111d]/85 shadow-[0_40px_120px_-30px_rgba(124,58,237,0.55)] backdrop-blur-sm">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            {c.url}
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
            {c.example}
          </span>
        </div>

        <div className="grid min-h-[430px] grid-cols-1 md:grid-cols-[170px_250px_1fr] lg:grid-cols-[170px_250px_1fr_220px]">
          <aside className="hidden border-r border-white/[0.07] p-3 md:block">
            <ul className="space-y-1">
              {c.nav.map((label, i) => {
                const Icon = NAV_ICONS[i]
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] ${
                      i === 0 ? 'bg-white/[0.08] text-white' : 'text-white/45'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {i === 0 && (
                      <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[9px] font-semibold text-white">
                        4
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </aside>

          <div className="hidden border-r border-white/[0.07] md:block">
            <ul>
              {c.list.map((r, i) => (
                <li
                  key={r.n}
                  className={`flex gap-3 border-b border-white/[0.05] px-4 py-3 ${i === 0 ? 'bg-white/[0.05]' : ''}`}
                >
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white/70">
                    {r.n[0]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] text-white/85">
                      <span className="truncate font-medium">{r.n}</span>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.col}`} />
                      <span className="text-[10px] text-white/35">{r.c}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-white/40">{i === 0 && showV2 ? c.v2 : r.m}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-h-[430px] flex-col p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white/70">
                  S
                </span>
                <div>
                  <p className="text-[12px] font-medium text-white/85">Selin K.</p>
                  <p className="text-[10px] text-white/35">Web · {c.open}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {c.widgetOn}
              </span>
            </div>

            <div className="flex-1 space-y-3 text-[12.5px] leading-snug">
              <div className="hv2-pop max-w-[82%] rounded-2xl rounded-bl-sm bg-white/[0.08] px-3.5 py-2.5 text-white/85">
                {c.v1}
              </div>
              {typing && (
                <div className="flex items-center justify-end gap-2">
                  <span className="rounded-md bg-violet-500/25 px-1.5 py-0.5 text-[9px] font-semibold text-violet-200">
                    {c.ai}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-white/[0.06] px-3 py-2 text-white/50">
                    <span className="hv2-dot" />
                    <span className="hv2-dot [animation-delay:150ms]" />
                    <span className="hv2-dot [animation-delay:300ms]" />
                  </span>
                </div>
              )}
              {showA1 && (
                <div className="hv2-pop ml-auto max-w-[88%]">
                  <div className="mb-1 flex justify-end">
                    <span className="rounded-md bg-violet-500/25 px-1.5 py-0.5 text-[9px] font-semibold text-violet-200">
                      {c.ai}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-br-sm bg-violet-500/80 px-3.5 py-2.5 text-white">{c.a1}</div>
                </div>
              )}
              {showV2 && (
                <div className="hv2-pop max-w-[82%] rounded-2xl rounded-bl-sm bg-white/[0.08] px-3.5 py-2.5 text-white/85">
                  {c.v2}
                </div>
              )}
              {showHandoff && (
                <div className="hv2-pop flex items-center gap-2 rounded-lg border border-teal-300/25 bg-teal-300/[0.06] px-3 py-2 text-[11px] text-teal-100/90">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                  <span>
                    {c.handoff} · <span className="font-semibold text-teal-200">{c.h1}</span>
                  </span>
                </div>
              )}
              {showR1 && (
                <div className="hv2-pop ml-auto max-w-[88%]">
                  <div className="mb-1 flex justify-end">
                    <span className="rounded-md bg-teal-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-teal-200">
                      {c.team}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-br-sm bg-violet-500/80 px-3.5 py-2.5 text-white">{c.r1}</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-white/30">
              {c.reply}
              <Send className="ml-auto h-3.5 w-3.5" />
            </div>
          </div>

          <aside className="hidden border-l border-white/[0.07] p-4 lg:block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{c.visitor}</p>
            <div className="mt-3 space-y-3 text-[12px]">
              <div className="flex items-center gap-2 text-white/75">
                <Globe className="h-3.5 w-3.5 text-white/35" />
                {c.loc}
              </div>
              <div>
                <p className="text-[10px] text-white/35">{c.now}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-white/70">{c.page}</p>
              </div>
              <p className="text-white/50">{c.history}</p>
              <div
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-500 ${
                  step >= 4 ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/[0.06] text-white/70'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                {c.watch}
                {step >= 4 && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 text-white/35">
                <Smartphone className="h-3.5 w-3.5" />
                <span className="text-[11px]">{c.mobile}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="absolute -bottom-7 right-4 z-20 hidden w-[240px] rounded-2xl border border-white/10 bg-[#0a1626]/95 p-3 shadow-2xl backdrop-blur sm:block lg:right-[-14px]">
        <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-teal-300 text-[10px] font-bold text-[#08111d]">
            G
          </span>
          <span className="text-[11px] font-medium text-white/80">{c.widgetName}</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/65">
          {showR1 ? c.r1 : showA1 ? c.a1 : c.v1}
        </p>
      </div>
    </div>
  )
}
