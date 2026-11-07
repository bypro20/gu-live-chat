'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Instrument_Serif } from 'next/font/google'
import { ArrowRight, Eye, MessageCircle, ShieldCheck, Inbox, BookOpen, UserRound, Layers } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { HeroStage } from '@/components/marketing/home-v2/hero-stage'
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
      { threshold: 0.15 },
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

const TR = {
  eyebrow: 'Canlı destek · Yapay zekâ · Ekran izleme',
  h1a: 'Ziyaretçin takıldığı an,',
  h1b: 'sen yanındasın.',
  sub: 'Sitenize gelen biri neden vazgeçtiğini asla söylemez. Gu Live Chat onu tam o anda görür, sana haber verir ve doğru kelimeyi söylemeni sağlar. Gerisini yapay zekâ ve ekibin tamamlar.',
  cta1: 'Ücretsiz başla',
  cta2: 'Fiyatları gör',
  note: '14 gün ücretsiz · Kart gerekmez · Kurulum 30 saniye',
  storyTag: 'Bir ziyaretçinin 90 saniyesi',
  storyTitle: 'Çoğu satış, kimsenin görmediği bir anda kaybedilir.',
  storyLead: 'Aşağıdaki sahne uydurma değil, her gün her sitede yaşanan şey. Fark, o anda birinin orada olup olmaması.',
  story: [
    { t: '0:00', h: 'Geliyor', p: 'Reklamdan ya da aramadan siteye düşüyor. Kim olduğunu, nereden geldiğini ve hangi sayfada olduğunu görüyorsun.' },
    { t: '0:38', h: 'Takılıyor', p: 'Ödeme adımına geliyor ve duruyor. Fareyi kargo satırının üstünde gezdiriyor. Çoğu site bu anı hiç bilmez.' },
    { t: '0:52', h: 'Sen görüyorsun', p: 'Canlı ekranını izliyorsun. Neye baktığını anlıyorsun, soru sormasını beklemeden yazıyorsun.' },
    { t: '1:30', h: 'Tamamlıyor', p: 'Doğru cevap doğru anda geldi. Sipariş tamamlandı, kimse formu doldurmak zorunda kalmadı.' },
  ],
  pillarsTag: 'Neler var',
  pillarsTitle: 'Tek ekranda: gören, yazan ve hatırlayan bir ekip.',
  pillars: {
    watch: { h: 'Ekranı canlı izle', p: 'Ziyaretçi sitende neye baktığını, nerede durduğunu ve nereye tıkladığını gör. Şifre ve kart alanları otomatik bulanık gelir.' },
    ai: { h: 'Yapay zekâ ilk yanıtı verir', p: 'Bilgi bankanla eğitilir, markanın dilinde konuşur. Emin olmadığında susar ve konuşmayı ekibine devreder.' },
    inbox: { h: 'Tek gelen kutusu', p: 'Site sohbeti, WhatsApp, Telegram ve Meta mesajları aynı yerde. Kimin neyi yazdığını her kanalda hatırlar.' },
    team: { h: 'Ekip olarak çalış', p: 'Sohbeti bana ata, çöz, yeniden aç. Not bırak. Kimin ilgilendiği herkesçe görünür.' },
  },
  aiTag: 'Yapay zekâ ve insan, aynı sohbette',
  aiTitle: 'Önce hızlı yanıt, sonra doğru kişi.',
  aiLead: 'Müşteri bekletilmez. Basit sorular saniyeler içinde cevaplanır, karmaşık olanlar ise geçmişiyle birlikte ekibine düşer. Müşteri tekrar anlatmak zorunda kalmaz.',
  aiPoints: ['Bilgi bankandan öğrenir: SSS, fiyat listesi, iade koşulları', 'Cevabı bilmiyorsa uydurmaz, sana devreder', 'Devralırken tüm konuşma önünde hazırdır'],
  chat: [
    { who: 'v', m: 'Kargo ne zaman gelir? Cumartesiye lazım.' },
    { who: 'a', m: 'İstanbul içi siparişler ertesi gün teslim. Bugün 16:00’dan önce verirseniz cumartesi elinizde.' },
    { who: 'v', m: 'Adresi değiştirmem gerekiyor, mümkün mü?' },
    { who: 'h', m: 'Adres değişikliği için ekibe aktarıldı. Elif sizinle devam ediyor.' },
  ],
  handoff: 'Elif devraldı',
  trustTag: 'Güven',
  trustTitle: 'Kullandığın araç, müşterine karşı sorumluluğundur.',
  trust: [
    { h: 'KVKK uyumlu, Türk altyapısı', p: 'Veri saklama süreleri ve çerez onayı panelden yönetilir.' },
    { h: 'Hassas alanlar bulanık', p: 'Parola, kart ve benzeri alanlar ekran izlemede otomatik gizlenir.' },
    { h: 'Gizlilik modu', p: 'Hassas bir giriş sırasında izleme geçici olarak kapanır, ekranda yalnızca bilgi notu görünür.' },
  ],
  finalTitle: 'Bir sonraki ziyaretçin gitmeden önce orada ol.',
  finalSub: '14 gün boyunca tüm özellikleri dene. Kart bilgisi istemiyoruz.',
  finalCta: 'Ücretsiz başla',
  finalCta2: 'Bize yazın',
  example: 'Örnek konuşma',
}

const EN: typeof TR = {
  eyebrow: 'Live chat · AI · Screen watch',
  h1a: 'The moment a visitor stalls,',
  h1b: 'you are right there.',
  sub: 'People rarely tell you why they left. Gu Live Chat sees them at that exact moment, tells you, and helps you say the right thing. AI and your team handle the rest.',
  cta1: 'Start free',
  cta2: 'See pricing',
  note: '14-day free trial · No card required · Set up in 30 seconds',
  storyTag: '90 seconds of one visitor',
  storyTitle: 'Most sales are lost in a moment nobody sees.',
  storyLead: 'This scene is not invented. It happens on every site, every day. The difference is whether someone is there.',
  story: [
    { t: '0:00', h: 'Arrives', p: 'Lands from an ad or a search. You see who they are, where they came from and which page they are on.' },
    { t: '0:38', h: 'Stalls', p: 'Reaches checkout and stops, hovering over the shipping line. Most sites never know this moment exists.' },
    { t: '0:52', h: 'You see it', p: 'You watch their live screen, understand what they are looking at and write before they have to ask.' },
    { t: '1:30', h: 'Completes', p: 'The right answer arrived at the right time. The order is done, no form was filled.' },
  ],
  pillarsTag: 'What you get',
  pillarsTitle: 'One screen: a team that sees, writes and remembers.',
  pillars: {
    watch: { h: 'Watch the screen live', p: 'See what visitors look at, where they pause and what they click. Password and card fields arrive blurred.' },
    ai: { h: 'AI gives the first reply', p: 'Trained on your knowledge base, speaks in your brand voice. When unsure it stays quiet and hands over to your team.' },
    inbox: { h: 'One inbox', p: 'Site chat, WhatsApp, Telegram and Meta messages in one place, remembering who wrote what on every channel.' },
    team: { h: 'Work as a team', p: 'Assign, resolve, reopen, leave notes. Who is handling what is visible to everyone.' },
  },
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
  trustTitle: 'The tool you use is your responsibility to your customers.',
  trust: [
    { h: 'KVKK compliant, Turkish infrastructure', p: 'Retention periods and cookie consent are managed from the panel.' },
    { h: 'Sensitive fields blurred', p: 'Passwords, cards and similar fields are hidden automatically in screen watch.' },
    { h: 'Privacy mode', p: 'During a sensitive entry, watching pauses temporarily and only an info note is shown.' },
  ],
  finalTitle: 'Be there before your next visitor leaves.',
  finalSub: 'Try every feature for 14 days. We do not ask for a card.',
  finalCta: 'Start free',
  finalCta2: 'Write to us',
  example: 'Example conversation',
}

export function HomeHeroV2() {
  const c = useCopy()
  return (
    <section className="hv2 hv2-hero relative overflow-hidden bg-[#07060d] px-4 pb-28 pt-32 text-white sm:px-6 sm:pt-40 lg:pt-44">
      <div className="hv2-aurora" aria-hidden="true" />
      <div className="hv2-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-[12px] tracking-wide text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {c.eyebrow}
        </p>
        <h1 className="mt-7 text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[5.4rem]">
          {c.h1a}
          <br />
          <span className={`${serif.className} italic font-normal text-violet-200`}>
            {c.h1b}
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">{c.sub}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#07060d] transition hover:bg-white/90"
          >
            {c.cta1} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
          >
            {c.cta2}
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/40">{c.note}</p>
      </div>
      <div className="relative mt-16 px-1 sm:mt-20">
        <HeroStage />
      </div>
    </section>
  )
}

export function StoryV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative bg-[#07060d] px-4 py-24 text-white sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.storyTag}</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
              {c.storyTitle}
            </h2>
            <p className="mt-5 max-w-md text-white/55 leading-relaxed">{c.storyLead}</p>
          </Reveal>
        </div>
        <ol className="relative space-y-10 border-l border-white/10 pl-8">
          {c.story.map((s, i) => (
            <li key={s.t} className="relative">
              <span className="absolute -left-[41px] top-1.5 grid h-5 w-5 place-items-center rounded-full border border-violet-300/40 bg-[#07060d]">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
              </span>
              <Reveal delay={i * 60}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm tabular-nums text-violet-300/90">{s.t}</span>
                  <h3 className="text-xl font-semibold tracking-tight">{s.h}</h3>
                </div>
                <p className="mt-2 max-w-xl leading-relaxed text-white/55">{s.p}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function PillarsV2() {
  const c = useCopy()
  const p = c.pillars
  return (
    <section className="hv2 relative bg-[#07060d] px-4 pb-28 text-white sm:px-6 sm:pb-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.pillarsTag}</p>
          <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            {c.pillarsTitle}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="hv2-card group h-full overflow-hidden p-8">
              <Eye className="h-6 w-6 text-teal-300" />
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">{p.watch.h}</h3>
              <p className="mt-3 max-w-lg leading-relaxed text-white/55">{p.watch.p}</p>
              <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="h-2 w-1/3 rounded bg-white/15" />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-14 rounded bg-white/[0.07]" />
                    <div className="h-14 rounded bg-white/[0.07]" />
                    <div className="h-14 rounded bg-violet-400/20 ring-1 ring-violet-300/40" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded bg-white/[0.06] px-2 py-1.5 text-[11px] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    <span className="blur-[3px]">•••• •••• •••• 4242</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={80}>
            <div className="hv2-card h-full p-8">
              <MessageCircle className="h-6 w-6 text-violet-300" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{p.ai.h}</h3>
              <p className="mt-3 leading-relaxed text-white/55">{p.ai.p}</p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={40}>
            <div className="hv2-card h-full p-8">
              <Inbox className="h-6 w-6 text-fuchsia-300" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{p.inbox.h}</h3>
              <p className="mt-3 leading-relaxed text-white/55">{p.inbox.p}</p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={120}>
            <div className="hv2-card h-full p-8">
              <Layers className="h-6 w-6 text-amber-200" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{p.team.h}</h3>
              <p className="mt-3 leading-relaxed text-white/55">{p.team.p}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function AiHumanV2() {
  const c = useCopy()
  return (
    <section className="hv2 relative overflow-hidden bg-[#0b0914] px-4 py-24 text-white sm:px-6 sm:py-32">
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
          <div className="rounded-2xl border border-white/10 bg-[#120f20]/80 p-5 shadow-[0_30px_100px_-30px_rgba(124,58,237,0.5)]">
            <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/35">{c.example}</p>
            <div className="space-y-3 text-sm">
              {c.chat.map((m, i) =>
                m.who === 'v' ? (
                  <div key={i} className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-sm bg-violet-500/80 px-4 py-2.5 text-white">
                    {m.m}
                  </div>
                ) : m.who === 'a' ? (
                  <div key={i} className="w-fit max-w-[88%] rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-2.5 text-white/85">
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
    <section className="hv2 relative bg-[#07060d] px-4 py-24 text-white sm:px-6 sm:py-32">
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
            <Reveal key={t.h} delay={i * 70} className="bg-[#0b0914]">
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
    <section className="hv2 relative overflow-hidden bg-[#07060d] px-4 py-28 text-center text-white sm:px-6 sm:py-36">
      <div className="hv2-aurora hv2-aurora-soft" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-3xl">
        <h2 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
          {c.finalTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-white/55">{c.finalSub}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#07060d] transition hover:bg-white/90"
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
