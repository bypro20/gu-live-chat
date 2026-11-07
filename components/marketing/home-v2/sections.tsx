'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Instrument_Serif } from 'next/font/google'
import {
  ArrowRight, Eye, ShieldCheck, Inbox, BookOpen, UserRound, Bot, Megaphone,
  LifeBuoy, Workflow, BarChart3, Phone, Languages, Smartphone, Palette, Terminal,
} from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { HeroStage } from '@/components/marketing/home-v2/hero-stage'
import { Marquee, Orb, SpotlightCard, TiltStage } from '@/components/marketing/home-v2/fx'
import { Smoke } from '@/components/marketing/home-v2/smoke'
import { usePrefersReducedMotion } from '@/components/marketing/home-v2/use-reduced-motion'

const serif = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', style: ['normal', 'italic'] })

function useCopy() {
  const { locale } = useLocale()
  return locale === 'en' ? EN : TR
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const [seen, setSeen] = useState(false)
  const shown = reduced || seen
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

type Feature = { h: string; p: string }

const TR = {
  eyebrow: 'Canlı destek · Yapay zekâ · Tek gelen kutusu',
  h1a: 'Müşterilerinle her kanaldan,',
  h1b: 'tek yerden konuş.',
  sub: 'Sitene tek satır kod ekle. Canlı sohbet, yapay zekâ asistanı, WhatsApp, Telegram ve Messenger mesajları ekibinin ortak gelen kutusunda buluşsun.',
  cta1: 'Ücretsiz başla',
  cta2: 'Canlı demo gör',
  note: '14 gün ücretsiz · Kart gerekmez · Kurulum 30 saniye',
  bubbles: [
    { m: 'Yarın için randevu alabilir miyim?', ch: 'WhatsApp', dot: 'bg-emerald-400' },
    { m: 'Bu ürün stokta var mı?', ch: 'Web', dot: 'bg-violet-400' },
    { m: 'Kargom nerede?', ch: 'Messenger', dot: 'bg-blue-400' },
    { m: 'Fiyat listesini alabilir miyim?', ch: 'Telegram', dot: 'bg-sky-400' },
  ],
  channelsTitle: 'Müşterin nerede yazarsa, cevap orada.',
  channels: ['Web sitesi sohbeti', 'WhatsApp', 'Telegram', 'Messenger', 'LinkedIn', 'SMS', 'Mobil uygulama'],
  installTag: 'Kurulum',
  installTitle: '30 saniyede yayında.',
  installLead: 'WordPress, Shopify ve tüm web siteleriyle çalışır. Teknik bilgi gerekmez, tek satır yeterli.',
  steps: [
    { h: 'Hesabını aç', p: 'E-posta ile kayıt ol, kredi kartı gerekmez.' },
    { h: 'Kodu sitene yapıştır', p: 'Widget kodunu sayfanın sonuna ekle.' },
    { h: 'İlk mesajı karşıla', p: 'Ziyaretçi yazdığı anda gelen kutunda görürsün.' },
  ],
  codeLabel: 'Sitenin </body> etiketinden önce',
  featTag: 'Neler var',
  featTitle: 'Canlı destek için gereken her şey, tek platformda.',
  features: [
    { h: 'Ziyaretçi takibi ve ekran izleme', p: 'Kim, nereden geldi, hangi sayfada? Gerekirse ekranı canlı izle ve doğru anda yaz. Şifre ve kart alanları otomatik bulanık gelir.' },
    { h: 'Canlı sohbet widget’ı', p: 'Renk, karşılama mesajı ve görünümü panelden markana göre ayarla.' },
    { h: 'Ortak gelen kutusu', p: 'Sohbeti ata, çöz, yeniden aç. Not bırak, hazır yanıtlarla hızlan.' },
    { h: 'Yapay zekâ asistanı', p: 'Bilgi bankanla eğitilir, ilk yanıtı verir, emin değilse ekibe devreder.' },
    { h: 'Sohbet botu editörü', p: 'Sürükle-bırak akışlarla müşteriyi doğru kişiye ya da cevaba yönlendir.' },
    { h: 'Proaktif mesaj ve kampanyalar', p: 'Doğru sayfada, doğru anda ziyaretçiye ilk sen yaz.' },
    { h: 'Bilet sistemi ve durum sayfası', p: 'Uzayan işleri bilete çevir, kesintileri durum sayfanda duyur.' },
    { h: 'Otomasyon, webhook ve API', p: 'İş akışları kur, olayları kendi sistemlerine ilet, API ile entegre ol.' },
    { h: 'Analitik ve memnuniyet puanı', p: 'Yanıt süreleri, yoğunluk ve müşteri puanları tek panelde.' },
    { h: 'Sesli yapay zekâ', p: 'Telefon görüşmelerini karşılayan sesli asistan.' },
    { h: '50+ dilde çeviri', p: 'Müşteri kendi dilinde yazar, sen kendi dilinde yanıtlarsın.' },
    { h: 'Mobil uygulama', p: 'Sohbetleri telefonundan yanıtla, bildirimi kaçırma.' },
  ] as Feature[],
  aiTag: 'Yapay zekâ ve insan, aynı sohbette',
  aiTitle: 'Önce hızlı yanıt, sonra doğru kişi.',
  aiLead: 'Müşteri bekletilmez. Basit sorular saniyeler içinde cevaplanır, karmaşık olanlar geçmişiyle birlikte ekibine düşer. Müşteri aynı şeyi iki kez anlatmaz.',
  aiPoints: ['Bilgi bankandan öğrenir: SSS, fiyat listesi, iade koşulları', 'Cevabı bilmiyorsa uydurmaz, sana devreder', 'Devralırken tüm konuşma önünde hazırdır'],
  chat: [
    { who: 'v', m: 'Kargo ne zaman gelir? Cumartesiye lazım.' },
    { who: 'a', m: 'İstanbul içi siparişler ertesi gün teslim. Bugün 16:00’dan önce verirseniz cumartesi elinizde.' },
    { who: 'v', m: 'Adresi değiştirmem gerekiyor, mümkün mü?' },
    { who: 'h', m: 'Adres değişikliği için ekibe aktarıldı. Elif sizinle devam ediyor.' },
  ],
  handoff: 'Elif devraldı',
  trustTag: 'Güven',
  trustTitle: 'Müşterinin verisi, senin sorumluluğun. Biz de öyle görüyoruz.',
  trust: [
    { h: 'KVKK uyumlu, Türk altyapısı', p: 'Veri saklama süreleri ve çerez onayı panelden yönetilir.' },
    { h: 'Hassas alanlar bulanık', p: 'Parola, kart ve benzeri alanlar ekran izlemede otomatik gizlenir.' },
    { h: 'Gizlilik modu', p: 'Hassas bir giriş sırasında izleme geçici olarak kapanır, ekranda yalnızca bilgi notu görünür.' },
  ],
  finalTitle: 'Bir sonraki müşterin yazdığında hazır ol.',
  finalSub: '14 gün boyunca tüm özellikleri dene. Kart bilgisi istemiyoruz.',
  finalCta: 'Ücretsiz başla',
  finalCta2: 'Bize yazın',
  example: 'Örnek konuşma',
}

const EN: typeof TR = {
  eyebrow: 'Live chat · AI · Shared inbox',
  h1a: 'Talk to your customers on every channel,',
  h1b: 'from one place.',
  sub: 'Add one line of code to your site. Live chat, AI assistant, WhatsApp, Telegram and Messenger messages all land in your team’s shared inbox.',
  cta1: 'Start free',
  cta2: 'See live demo',
  note: '14-day free trial · No card required · Set up in 30 seconds',
  bubbles: [
    { m: 'Can I book for tomorrow?', ch: 'WhatsApp', dot: 'bg-emerald-400' },
    { m: 'Is this item in stock?', ch: 'Web', dot: 'bg-violet-400' },
    { m: 'Where is my order?', ch: 'Messenger', dot: 'bg-blue-400' },
    { m: 'Could I get the price list?', ch: 'Telegram', dot: 'bg-sky-400' },
  ],
  channelsTitle: 'Wherever your customer writes, you answer there.',
  channels: ['Website chat', 'WhatsApp', 'Telegram', 'Messenger', 'LinkedIn', 'SMS', 'Mobile app'],
  installTag: 'Setup',
  installTitle: 'Live in 30 seconds.',
  installLead: 'Works with WordPress, Shopify and any website. No technical skills needed, one line is enough.',
  steps: [
    { h: 'Create your account', p: 'Sign up with email, no credit card required.' },
    { h: 'Paste the code into your site', p: 'Add the widget code to the end of your page.' },
    { h: 'Greet the first message', p: 'The moment a visitor writes, you see it in your inbox.' },
  ],
  codeLabel: 'Before the </body> tag of your site',
  featTag: 'What you get',
  featTitle: 'Everything live support needs, on one platform.',
  features: [
    { h: 'Visitor tracking and screen watch', p: 'Who, from where, on which page? Watch the screen live when needed and write at the right moment. Password and card fields arrive blurred.' },
    { h: 'Live chat widget', p: 'Set colors, greeting and look to match your brand from the panel.' },
    { h: 'Shared inbox', p: 'Assign, resolve, reopen. Leave notes and speed up with canned replies.' },
    { h: 'AI assistant', p: 'Trained on your knowledge base, gives the first reply and hands over when unsure.' },
    { h: 'Chatbot builder', p: 'Route customers to the right person or answer with drag-and-drop flows.' },
    { h: 'Proactive messages and campaigns', p: 'Be the first to write, on the right page at the right moment.' },
    { h: 'Ticketing and status page', p: 'Turn long-running issues into tickets and announce outages on your status page.' },
    { h: 'Automation, webhooks and API', p: 'Build workflows, send events to your own systems, integrate through the API.' },
    { h: 'Analytics and satisfaction score', p: 'Response times, volume and customer ratings in one panel.' },
    { h: 'Voice AI', p: 'A voice assistant that answers phone calls.' },
    { h: 'Translation in 50+ languages', p: 'Customers write in their language, you reply in yours.' },
    { h: 'Mobile app', p: 'Reply from your phone and never miss a notification.' },
  ],
  aiTag: 'AI and humans in the same chat',
  aiTitle: 'Fast first, then the right person.',
  aiLead: 'Nobody waits. Simple questions are answered in seconds, complex ones land with your team along with their history, so customers never repeat themselves.',
  aiPoints: ['Learns from your knowledge base: FAQ, price list, return policy', 'Does not make things up, hands over instead', 'Full conversation is ready when you take over'],
  chat: [
    { who: 'v', m: 'When will it arrive? I need it by Saturday.' },
    { who: 'a', m: 'Orders inside the city arrive next day. Order before 4 PM today and you will have it Saturday.' },
    { who: 'v', m: 'I need to change the address, is that possible?' },
    { who: 'h', m: 'Passed to the team for an address change. Elif is continuing with you.' },
  ],
  handoff: 'Elif took over',
  trustTag: 'Trust',
  trustTitle: 'Your customers’ data is your responsibility. We see it the same way.',
  trust: [
    { h: 'KVKK compliant, Turkish infrastructure', p: 'Retention periods and cookie consent are managed from the panel.' },
    { h: 'Sensitive fields blurred', p: 'Passwords, cards and similar fields are hidden automatically in screen watch.' },
    { h: 'Privacy mode', p: 'During a sensitive entry, watching pauses temporarily and only an info note is shown.' },
  ],
  finalTitle: 'Be ready when your next customer writes.',
  finalSub: 'Try every feature for 14 days. We do not ask for a card.',
  finalCta: 'Start free',
  finalCta2: 'Write to us',
  example: 'Example conversation',
}

const FEATURE_ICONS = [Eye, Palette, Inbox, Bot, Workflow, Megaphone, LifeBuoy, Terminal, BarChart3, Phone, Languages, Smartphone]
const FEATURE_TONE = [
  'text-teal-300', 'text-violet-300', 'text-fuchsia-300', 'text-violet-300', 'text-amber-200', 'text-rose-300',
  'text-sky-300', 'text-emerald-300', 'text-teal-300', 'text-fuchsia-300', 'text-sky-300', 'text-violet-300',
]

export function HomeHeroV2() {
  const c = useCopy()
  const stageRef = useRef<HTMLDivElement>(null)
  return (
    <section className="hv2 relative overflow-hidden bg-[#04070d] px-4 pb-28 pt-24 text-white sm:px-6">
      <div className="hv2-aurora hv2-aurora-soft" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.eyebrow}</p>
        <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
          {c.h1a} <span className={`${serif.className} italic font-normal text-violet-200`}>{c.h1b}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-pretty leading-relaxed text-white/60 sm:text-lg">{c.sub}</p>
        <p className="mt-5 text-xs text-white/40">{c.note}</p>
      </div>
      <div className="relative mt-14 px-1 sm:mt-16">
        <div className="pointer-events-none absolute -inset-x-[12%] -inset-y-[34%] hidden [mask-image:radial-gradient(closest-side,#000_60%,transparent)] sm:block" aria-hidden="true">
          <Smoke targetRef={stageRef} level={0.7} hue={200} />
        </div>
        <div ref={stageRef} className="relative mx-auto w-full max-w-[1100px]">
          <TiltStage>
            <HeroStage />
          </TiltStage>
        </div>
      </div>
    </section>
  )
}

const CHANNEL_DOTS = ['bg-violet-400', 'bg-emerald-400', 'bg-sky-400', 'bg-blue-400', 'bg-cyan-400', 'bg-amber-300', 'bg-fuchsia-400']

export function ChannelsV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative bg-[#04070d] px-0 pb-8 pt-20 text-white">
      <Reveal className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-sm text-white/45">{c.channelsTitle}</p>
      </Reveal>
      <div className="mt-7">
        <Marquee items={c.channels.map((label, i) => ({ label, dot: CHANNEL_DOTS[i % CHANNEL_DOTS.length] }))} />
      </div>
    </section>
  )
}

export function InstallV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative bg-[#04070d] px-4 py-24 text-white sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.installTag}</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            {c.installTitle}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-white/55">{c.installLead}</p>
          <ol className="mt-9 space-y-5">
            {c.steps.map((s, i) => (
              <li key={s.h} className="flex gap-4">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-violet-300/40 font-mono text-[12px] text-violet-200">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{s.h}</p>
                  <p className="mt-0.5 text-sm text-white/50">{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#08111d] shadow-[0_30px_100px_-30px_rgba(124,58,237,0.5)]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3 text-[11px] text-white/40">
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="ml-2">index.html</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-white/70">
              <code>
                <span className="text-white/30">{`<!-- ${c.codeLabel} -->`}</span>
                {'\n'}
                <span className="text-fuchsia-300">{'<script'}</span> <span className="text-sky-300">async</span>{' '}
                <span className="text-sky-300">src</span>=<span className="text-emerald-300">{'"https://www.gulivechat.com/widget.js"'}</span>
                <span className="text-fuchsia-300">{'></script>'}</span>
              </code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function FeaturesV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative bg-[#04070d] px-4 pb-28 text-white sm:px-6 sm:pb-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.featTag}</p>
          <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            {c.featTitle}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i]
            const big = i === 0
            return (
              <Reveal key={f.h} delay={(i % 3) * 70} className={big ? 'lg:col-span-2' : i === c.features.length - 1 ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <SpotlightCard className={`h-full p-7 ${big ? 'lg:p-9' : ''}`}>
                  <Icon className={`h-5 w-5 ${FEATURE_TONE[i]}`} />
                  <h3 className={`mt-5 font-semibold tracking-tight ${big ? 'text-2xl' : 'text-lg'}`}>{f.h}</h3>
                  <p className={`mt-3 leading-relaxed text-white/55 ${big ? 'max-w-xl' : 'text-[15px]'}`}>{f.p}</p>
                  {big && (
                    <div className="mt-7 max-w-md rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="h-2 w-1/3 rounded bg-white/15" />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="h-12 rounded bg-white/[0.07]" />
                        <div className="h-12 rounded bg-white/[0.07]" />
                        <div className="h-12 rounded bg-violet-400/20 ring-1 ring-violet-300/40" />
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded bg-white/[0.06] px-2 py-1.5 text-[11px] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span className="blur-[3px]">•••• •••• •••• 4242</span>
                      </div>
                    </div>
                  )}
                </SpotlightCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function AiHumanV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative overflow-hidden bg-[#07101a] px-4 py-24 text-white sm:px-6 sm:py-32">
      <div className="hv2-aurora hv2-aurora-soft" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.aiTag}</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            {c.aiTitle}
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-white/55">{c.aiLead}</p>
          <ul className="mt-8 space-y-3">
            {c.aiPoints.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-white/75">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-2xl border border-white/10 bg-[#0a1626]/80 p-5 shadow-[0_30px_100px_-30px_rgba(124,58,237,0.5)]">
            <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/35">{c.example}</p>
            <div className="space-y-3 text-sm">
              {c.chat.map((m, i) =>
                m.who === 'v' ? (
                  <div key={i} className="w-fit max-w-[82%] rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-2.5 text-white/85">
                    {m.m}
                  </div>
                ) : m.who === 'a' ? (
                  <div key={i} className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-sm bg-violet-500/80 px-4 py-2.5 text-white">
                    {m.m}
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-teal-300/25 bg-teal-300/[0.06] px-4 py-3 text-teal-50/90">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">{c.handoff}</p>
                      <p className="mt-0.5">{m.m}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function TrustV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative bg-[#04070d] px-4 py-24 text-white sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-violet-300/80">
            <ShieldCheck className="h-4 w-4" /> {c.trustTag}
          </p>
          <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            {c.trustTitle}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {c.trust.map((t, i) => (
            <Reveal key={t.h} delay={i * 70} className="bg-[#07101a]">
              <div className="h-full p-8">
                <h3 className="text-lg font-semibold tracking-tight">{t.h}</h3>
                <p className="mt-3 leading-relaxed text-white/55">{t.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCtaV2() {
  const c = useCopy()
  return (
    <section className="hv2 hv2-grain relative overflow-hidden bg-[#04070d] px-4 py-28 text-center text-white sm:px-6 sm:py-36">
      <div className="hv2-aurora hv2-aurora-soft" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-3xl">
        <Orb />
        <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
          {c.finalTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-white/55">{c.finalSub}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="hv2-btn hv2-btn-glow inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#04070d] transition hover:bg-white/90"
          >
            {c.finalCta} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl border border-white/15 px-8 py-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
          >
            {c.finalCta2}
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
