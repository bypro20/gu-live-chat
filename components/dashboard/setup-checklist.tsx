'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, Copy } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'

type Item = { id: string; done: boolean; title: string; desc: string; href?: string; copy?: boolean }

const COPY = {
  tr: {
    title: 'Kurulum',
    sub: 'Birkaç adımda her şey çalışır.',
    done: 'Hepsi tamam',
    doneSub: 'Kurulum bitti. Müşterileriniz yazmaya hazır.',
    copy: 'Kodu kopyala',
    copied: 'Kopyalandı',
    widgetT: 'Widget kodunu sitene ekle',
    widgetD: 'Tek satır kod. WordPress, Shopify ve tüm sitelerde çalışır.',
    chatT: 'İlk sohbeti karşıla',
    chatD: 'Ziyaretçi yazdığında gelen kutunda görünür.',
    aiT: 'Yapay zekâ asistanını aç',
    aiD: 'Bilgi bankanla eğitilir, ilk yanıtı o verir.',
    chT: 'Bir kanal daha bağla',
    chD: 'WhatsApp, Telegram veya Messenger.',
    teamT: 'Ekip arkadaşı davet et',
    teamD: 'Sohbetleri birlikte yanıtlayın.',
    steps: (a: number, b: number) => `${a} / ${b} adım`,
  },
  en: {
    title: 'Setup',
    sub: 'A few steps and everything works.',
    done: 'All set',
    doneSub: 'Setup is complete. Your customers are ready to write.',
    copy: 'Copy code',
    copied: 'Copied',
    widgetT: 'Add the widget code to your site',
    widgetD: 'One line of code. Works on WordPress, Shopify and any site.',
    chatT: 'Greet your first chat',
    chatD: 'It appears in your inbox the moment a visitor writes.',
    aiT: 'Turn on the AI assistant',
    aiD: 'Trained on your knowledge base, it gives the first reply.',
    chT: 'Connect another channel',
    chD: 'WhatsApp, Telegram or Messenger.',
    teamT: 'Invite a teammate',
    teamD: 'Answer chats together.',
    steps: (a: number, b: number) => `${a} / ${b} steps`,
  },
}

export function SetupChecklist({
  snippet,
  hasChats,
  aiActive,
  hasExtraChannel,
  hasTeam,
}: {
  snippet: string
  hasChats: boolean
  aiActive: boolean
  hasExtraChannel: boolean
  hasTeam: boolean
}) {
  const { locale } = useLocale()
  const c = locale === 'en' ? COPY.en : COPY.tr
  const [copied, setCopied] = useState(false)

  const items: Item[] = [
    { id: 'widget', done: hasChats, title: c.widgetT, desc: c.widgetD, copy: true },
    { id: 'chat', done: hasChats, title: c.chatT, desc: c.chatD, href: '/inbox' },
    { id: 'ai', done: aiActive, title: c.aiT, desc: c.aiD, href: '/settings/chatbot' },
    { id: 'ch', done: hasExtraChannel, title: c.chT, desc: c.chD, href: '/settings/channels' },
    { id: 'team', done: hasTeam, title: c.teamT, desc: c.teamD, href: '/settings/team' },
  ]
  const doneCount = items.filter((i) => i.done).length
  const pct = doneCount / items.length
  const R = 22
  const C = 2 * Math.PI * R

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // pano erişimi yok
    }
  }

  if (doneCount === items.length) {
    return (
      <section className="surface flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">{c.done}</p>
          <p className="text-xs text-muted-foreground">{c.doneSub}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="28" cy="28" r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
          <circle
            cx="28" cy="28" r={R} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
            className="text-primary transition-all duration-700"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{c.title}</h2>
          <p className="text-xs text-muted-foreground">{c.sub} · {c.steps(doneCount, items.length)}</p>
        </div>
      </div>

      <ol className="mt-5 divide-y divide-border/70">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 py-3">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                it.done ? 'border-success/40 bg-success/15 text-success' : 'border-border text-muted-foreground'
              }`}
            >
              {it.done ? <Check className="h-3.5 w-3.5" /> : ''}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${it.done ? 'text-muted-foreground line-through decoration-border' : ''}`}>{it.title}</p>
              <p className="truncate text-xs text-muted-foreground">{it.desc}</p>
            </div>
            {!it.done && it.copy && (
              <button
                onClick={copyCode}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:border-primary/50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? c.copied : c.copy}
              </button>
            )}
            {!it.done && it.href && (
              <Link href={it.href} className="inline-flex shrink-0 items-center text-primary transition hover:translate-x-0.5" aria-label={it.title}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
