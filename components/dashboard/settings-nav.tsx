'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings, Palette, Radio, Bot, BookOpen, Workflow, MessageSquareText, Megaphone, Zap, Star, LifeBuoy,
  Activity, Webhook, Users, CreditCard, ShieldCheck, Phone, Puzzle,
} from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import { useNativeApp } from '@/lib/hooks/use-native-app'

type Item = { href: string; tr: string; en: string; icon: typeof Settings }
type Group = { tr: string; en: string; items: Item[] }

const GROUPS: Group[] = [
  {
    tr: 'Genel', en: 'General',
    items: [
      { href: '/settings', tr: 'Genel', en: 'General', icon: Settings },
      { href: '/settings/widget', tr: 'Sohbet widget’ı', en: 'Chat widget', icon: Palette },
      { href: '/settings/channels', tr: 'Kanallar', en: 'Channels', icon: Radio },
    ],
  },
  {
    tr: 'Yapay zekâ ve içerik', en: 'AI & content',
    items: [
      { href: '/settings/chatbot', tr: 'Sohbet botu', en: 'Chatbot', icon: Bot },
      { href: '/settings/knowledge', tr: 'Bilgi bankası', en: 'Knowledge base', icon: BookOpen },
      { href: '/settings/voice-agent', tr: 'Sesli yapay zekâ', en: 'Voice AI', icon: Phone },
      { href: '/settings/canned-responses', tr: 'Hazır yanıtlar', en: 'Canned replies', icon: MessageSquareText },
    ],
  },
  {
    tr: 'Otomasyon', en: 'Automation',
    items: [
      { href: '/settings/workflows', tr: 'İş akışları', en: 'Workflows', icon: Workflow },
      { href: '/settings/proactive', tr: 'Proaktif mesajlar', en: 'Proactive messages', icon: Zap },
      { href: '/settings/campaigns', tr: 'Kampanyalar', en: 'Campaigns', icon: Megaphone },
      { href: '/settings/webhooks', tr: 'Webhook', en: 'Webhooks', icon: Webhook },
    ],
  },
  {
    tr: 'Destek', en: 'Support',
    items: [
      { href: '/settings/tickets', tr: 'Biletler', en: 'Tickets', icon: LifeBuoy },
      { href: '/settings/ratings', tr: 'Memnuniyet puanı', en: 'Satisfaction', icon: Star },
      { href: '/settings/status-page', tr: 'Durum sayfası', en: 'Status page', icon: Activity },
    ],
  },
  {
    tr: 'Hesap', en: 'Account',
    items: [
      { href: '/settings/team', tr: 'Ekip', en: 'Team', icon: Users },
      { href: '/settings/billing', tr: 'Faturalama', en: 'Billing', icon: CreditCard },
      { href: '/settings/plans', tr: 'Planlar', en: 'Plans', icon: Zap },
      { href: '/settings/addons', tr: 'Eklentiler', en: 'Add-ons', icon: Puzzle },
      { href: '/settings/privacy', tr: 'Gizlilik ve KVKK', en: 'Privacy', icon: ShieldCheck },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()
  const { locale } = useLocale()
  const { isNativeCustomerApp } = useNativeApp()
  const en = locale === 'en'
  if (isNativeCustomerApp) return null

  const isActive = (href: string) => (href === '/settings' ? pathname === '/settings' : pathname === href || pathname.startsWith(href + '/'))

  return (
    <aside className="shrink-0 border-b border-border lg:sticky lg:top-0 lg:h-[100dvh] lg:w-60 lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {/* Telefon/tablet: yatay kaydırmalı sekmeler */}
      <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:hidden" aria-label={en ? 'Settings' : 'Ayarlar'}>
        {GROUPS.flatMap((g) => g.items).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              isActive(it.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {en ? it.en : it.tr}
          </Link>
        ))}
      </nav>

      <nav className="hidden p-4 lg:block" aria-label={en ? 'Settings' : 'Ayarlar'}>
        <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{en ? 'Settings' : 'Ayarlar'}</p>
        {GROUPS.map((g) => (
          <div key={g.en} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{en ? g.en : g.tr}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon
                const active = isActive(it.href)
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                        active
                          ? 'bg-primary/12 font-medium text-foreground shadow-[inset_2px_0_0_var(--primary)]'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                      {en ? it.en : it.tr}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
