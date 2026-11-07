'use client'

import Link from 'next/link'
import { Bot, Eye, MessageSquare, Radio, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'

type Props = {
  name?: string | null
  siteName?: string | null
  planLabel?: string | null
  activeVisitors: number
  openChats: number
  aiActive: boolean
}

const COPY = {
  tr: {
    center: 'Komuta merkezi',
    hello: (n: string) => `Merhaba ${n}`,
    helloDefault: 'Hoş geldin',
    sub: (s: string) => `${s} için canlı durum, sohbetler ve ziyaretçiler tek bakışta.`,
    subDefault: 'Canlı durum, sohbetler ve ziyaretçiler tek bakışta.',
    live: (n: number) => `${n} canlı ziyaretçi`,
    quiet: 'Şu an sakin',
    chats: (n: number) => `${n} açık sohbet`,
    aiOn: 'Yapay zekâ açık',
    aiOff: 'Yapay zekâ kapalı',
    channels: 'Kanallar',
    inbox: 'Gelen kutusu',
    watch: 'Ziyaretçileri izle',
  },
  en: {
    center: 'Command center',
    hello: (n: string) => `Hello ${n}`,
    helloDefault: 'Welcome',
    sub: (s: string) => `Live status, chats and visitors for ${s} at a glance.`,
    subDefault: 'Live status, chats and visitors at a glance.',
    live: (n: number) => `${n} live visitors`,
    quiet: 'Quiet right now',
    chats: (n: number) => `${n} open chats`,
    aiOn: 'AI is on',
    aiOff: 'AI is off',
    channels: 'Channels',
    inbox: 'Inbox',
    watch: 'Watch visitors',
  },
}

export function CommandHero({ name, siteName, planLabel, activeVisitors, openChats, aiActive }: Props) {
  const { locale } = useLocale()
  const c = locale === 'en' ? COPY.en : COPY.tr
  const first = name?.split(' ')[0]

  return (
    <section className="surface relative overflow-hidden p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 90% at 0% 0%, rgba(124,58,237,0.28), transparent 60%), radial-gradient(40% 70% at 100% 10%, rgba(20,184,166,0.16), transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{c.center}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{first ? c.hello(first) : c.helloDefault}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{siteName ? c.sub(siteName) : c.subDefault}</p>

          <ul className="mt-5 flex flex-wrap gap-2">
            <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <span className="relative flex h-2 w-2">
                {activeVisitors > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${activeVisitors > 0 ? 'bg-success' : 'bg-muted-foreground/50'}`} />
              </span>
              {activeVisitors > 0 ? c.live(activeVisitors) : c.quiet}
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              {c.chats(openChats)}
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Bot className={`h-3.5 w-3.5 ${aiActive ? 'text-success' : 'text-muted-foreground'}`} />
              {aiActive ? c.aiOn : c.aiOff}
            </li>
            {planLabel && (
              <li className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {planLabel}
              </li>
            )}
          </ul>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/visitors" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:border-primary/40">
            <Eye className="h-4 w-4" /> {c.watch}
          </Link>
          <Link href="/settings/channels" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:border-primary/40">
            <Radio className="h-4 w-4" /> {c.channels}
          </Link>
          <Link href="/inbox" className="btn-primary">
            <MessageSquare className="h-4 w-4" /> {c.inbox}
          </Link>
        </div>
      </div>
    </section>
  )
}
