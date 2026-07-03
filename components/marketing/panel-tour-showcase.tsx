'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  BarChart3, BookOpen, Bot, CreditCard, Globe, Inbox, LayoutDashboard,
  MessageCircle, MessageSquare, Puzzle, Settings, Shield, Sparkles,
  Star, Ticket, Users, Webhook, Workflow, Zap,
} from 'lucide-react'
import { DemoChrome, useSteps } from '@/components/marketing/feature-micro-showcases'
import { useLocale } from '@/components/marketing/locale-provider'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import { getDashboardMessages, getDashboardNavGroups } from '@/lib/dashboard-i18n'

const HINTS: Record<string, { tr: string; en: string }> = {
  '/dashboard': { tr: 'Açık sohbetler, ziyaretçiler ve günlük performans özeti.', en: 'Open chats, visitors, and daily performance at a glance.' },
  '/inbox': { tr: 'Tüm kanallardan gelen mesajlara anında yanıt verin.', en: 'Reply instantly to messages from every channel.' },
  '/contacts': { tr: 'Müşteri geçmişi, iletişim bilgileri ve etiketler.', en: 'Customer history, contact details, and tags.' },
  '/analytics': { tr: 'Yanıt süresi, AI öngörüleri, duygu dağılımı ve ekip performansı.', en: 'Response time, AI insights, sentiment, and team performance.' },
  '/visitors': { tr: 'Sitedeki ziyaretçileri canlı izleyin ve müdahale edin.', en: 'Watch live visitors on your site and intervene.' },
  '/settings/widget': { tr: 'Tek satır kodla canlı sohbet widget\'ını sitenize ekleyin.', en: 'Add the live chat widget to your site with one line of code.' },
  '/settings/channels': { tr: 'WhatsApp, SMS, LinkedIn, e-posta, Instagram ve Telegram bağlayın.', en: 'Connect WhatsApp, SMS, LinkedIn, email, Instagram, and Telegram.' },
  '/settings/knowledge': { tr: 'SSS makaleleri, PDF/URL RAG eğitimi ve yardım merkezi.', en: 'FAQ articles, PDF/URL RAG training, and help center.' },
  '/settings/tickets': { tr: 'Destek biletlerini takip edin ve yönetin.', en: 'Track and manage support tickets.' },
  '/settings/chatbot': { tr: 'AI bot, web araması, multimodal ve akıllı model ayarları.', en: 'AI bot, web search, multimodal, and smart routing settings.' },
  '/settings/voice-agent': { tr: 'Sesli AI asistan — embed link ve karşılama mesajı.', en: 'Voice AI assistant — embed link and greeting.' },
  '/settings/canned-responses': { tr: 'Sık kullanılan hazır cevap şablonları.', en: 'Frequently used canned reply templates.' },
  '/settings/ratings': { tr: 'Müşteri memnuniyet puanlarını toplayın.', en: 'Collect customer satisfaction scores.' },
  '/settings/workflows': { tr: 'Tetikleyici ve aksiyonla otomasyon akışları.', en: 'Automation flows with triggers and actions.' },
  '/settings/campaigns': { tr: 'E-posta kampanyaları planlayın ve gönderin.', en: 'Plan and send email campaigns.' },
  '/settings': { tr: 'Site adı, dil, çalışma saatleri ve genel tercihler.', en: 'Site name, language, business hours, and preferences.' },
  '/settings/team': { tr: 'Temsilci davet edin ve roller atayın.', en: 'Invite agents and assign roles.' },
  '/settings/webhooks': { tr: 'CRM ve diğer sistemlere webhook gönderin.', en: 'Send webhooks to CRM and other systems.' },
  '/settings/proactive': { tr: 'Ziyaretçiye otomatik karşılama mesajları.', en: 'Automatic greeting messages to visitors.' },
  '/settings/status-page': { tr: 'Sistem durumu sayfası oluşturun.', en: 'Create a public system status page.' },
  '/settings/addons': { tr: 'Ek özellikleri mağazadan aktifleştirin.', en: 'Enable extra features from the add-on store.' },
  '/settings/plans': { tr: 'Paketinizi yükseltin veya düşürün.', en: 'Upgrade or downgrade your plan.' },
  '/settings/billing': { tr: 'Fatura geçmişi ve ödeme yöntemleri.', en: 'Invoice history and payment methods.' },
  '/settings/privacy': { tr: 'KVKK, çerez onayı ve veri saklama ayarları.', en: 'GDPR, cookie consent, and data retention settings.' },
}

function PanelContent({
  href,
  isTr,
  planPrices,
}: {
  href: string
  isTr: boolean
  planPrices: { starter: string; pro: string; business: string }
}) {
  const card = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
  const label = 'text-xs font-semibold text-slate-500 uppercase tracking-wide'

  switch (href) {
    case '/dashboard':
      return (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            [isTr ? 'Açık sohbet' : 'Open chats', '12', 'text-indigo-600'],
            [isTr ? 'Bugün mesaj' : 'Messages today', '48', 'text-violet-600'],
            [isTr ? 'Canlı ziyaretçi' : 'Live visitors', '5', 'text-emerald-600'],
            [isTr ? 'Ort. yanıt' : 'Avg. response', '42sn', 'text-amber-600'],
          ].map(([t, v, c]) => (
            <div key={String(t)} className={card}>
              <p className={label}>{t}</p>
              <p className={`text-2xl font-extrabold mt-1 ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )
    case '/inbox':
      return (
        <div className="flex h-full min-h-[280px]">
          <div className="w-20 border-r border-slate-200 bg-slate-50 p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-10 rounded-lg ${i === 1 ? 'bg-indigo-100 border-2 border-indigo-300' : 'bg-white border border-slate-200'}`} />
            ))}
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 max-w-[85%] text-sm text-slate-700">
              {isTr ? 'Kargo ne zaman gelir?' : 'When will my order arrive?'}
            </div>
            <div className="rounded-2xl rounded-tr-md bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 max-w-[88%] ml-auto text-sm text-white">
              {isTr ? 'Bugün kargoya verildi ✓' : 'Shipped today ✓'}
            </div>
          </div>
        </div>
      )
    case '/contacts':
      return (
        <div className="p-4 space-y-2">
          {['Ayşe K.', 'Mehmet Y.', 'Zeynep D.'].map((name, i) => (
            <div key={name} className={`${card} flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-full bg-violet-500 text-white text-sm font-bold flex items-center justify-center">{name[0]}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{name}</p>
                <p className="text-xs text-slate-400">{i + 2} {isTr ? 'sohbet' : 'chats'}</p>
              </div>
            </div>
          ))}
        </div>
      )
    case '/analytics':
      return (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3">
              <p className="text-xs text-indigo-600 font-semibold">{isTr ? 'Ziyaretçi' : 'Visitors'}</p>
              <p className="text-xl font-extrabold text-indigo-900">1.284</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-xs text-emerald-600 font-semibold">{isTr ? 'Dönüşüm' : 'Conversion'}</p>
              <p className="text-xl font-extrabold text-emerald-900">12.4%</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-24">
            {[45, 62, 55, 78, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )
    case '/visitors':
      return (
        <div className="p-4 space-y-2">
          {['/fiyatlandirma', '/urunler', '/iletisim'].map((page, i) => (
            <div key={page} className={`${card} flex items-center justify-between`}>
              <div>
                <p className="text-sm font-medium text-slate-800">{isTr ? `Ziyaretçi ${i + 1}` : `Visitor ${i + 1}`}</p>
                <p className="text-xs text-indigo-600">{page}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ))}
        </div>
      )
    case '/settings/widget':
      return (
        <div className="p-4">
          <div className="rounded-xl bg-slate-900 p-3 mb-3">
            <code className="text-[10px] text-emerald-400 font-mono">{`<script src="gulivechat.com/widget.js"></script>`}</code>
          </div>
          <div className="relative h-28 rounded-xl border border-slate-200 bg-slate-50">
            <div className="absolute bottom-3 right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )
    case '/settings/channels':
      return (
        <div className="p-4 flex flex-wrap gap-2">
          {['WhatsApp', 'E-posta', 'Instagram', 'Telegram'].map((ch, i) => (
            <span key={ch} className={`px-3 py-2 rounded-full text-xs font-semibold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{ch}</span>
          ))}
        </div>
      )
    case '/settings/chatbot':
      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">{isTr ? 'AI Asistan aktif' : 'AI Assistant active'}</span>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 max-w-[90%]">
            {isTr ? 'İade politikanız nedir?' : 'What is your return policy?'}
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-sm text-violet-900 max-w-[90%] ml-auto">
            {isTr ? '14 gün içinde iade yapabilirsiniz.' : 'Returns within 14 days.'}
          </div>
        </div>
      )
    case '/settings/plans':
      return (
        <div className="p-4 space-y-2">
          {[
            [isTr ? 'Starter' : 'Starter', planPrices.starter],
            [isTr ? 'PRO' : 'PRO', planPrices.pro],
            [isTr ? 'Business' : 'Business', planPrices.business],
          ].map(([name, price]) => (
            <div key={String(name)} className={`${card} flex justify-between items-center`}>
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-sm font-bold text-indigo-600">
                {price}
                <span className="text-xs text-slate-400 font-normal">{isTr ? '/ay' : '/mo'}</span>
              </span>
            </div>
          ))}
        </div>
      )
    case '/settings/billing':
      return (
        <div className="p-4">
          <div className={`${card} border-indigo-200 bg-indigo-50`}>
            <p className="text-sm font-bold text-slate-800">PRO · {isTr ? 'Aylık' : 'Monthly'}</p>
            <p className="text-lg font-extrabold text-indigo-600 mt-1">
              {planPrices.pro}
              <span className="text-xs font-medium text-slate-400">{isTr ? '/ay' : '/mo'}</span>
            </p>
          </div>
        </div>
      )
    case '/settings/team':
      return (
        <div className="p-4 flex gap-3">
          {['A', 'M', 'Z'].map((l) => (
            <div key={l} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shadow-md">{l}</div>
          ))}
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xl">+</div>
        </div>
      )
    default:
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[240px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3">
            <Settings className="w-7 h-7 text-indigo-600" />
          </div>
          <p className="text-sm text-slate-500">{isTr ? 'Panel ekranı' : 'Panel screen'}</p>
        </div>
      )
  }
}

const ICONS: Record<string, typeof Inbox> = {
  home: LayoutDashboard,
  inbox: Inbox,
  contacts: Users,
  analytics: BarChart3,
  visitors: Globe,
  widget: MessageCircle,
  channels: MessageSquare,
  book: BookOpen,
  ticket: Ticket,
  bot: Bot,
  message: MessageSquare,
  star: Star,
  workflow: Workflow,
  campaign: Zap,
  settings: Settings,
  team: Users,
  webhook: Webhook,
  proactive: MessageCircle,
  status: Globe,
  puzzle: Puzzle,
  package: CreditCard,
  billing: CreditCard,
  shield: Shield,
}

export function PanelTourShowcase({ className = '' }: { className?: string }) {
  const { locale } = useLocale()
  const { planPrice } = useRegionalPricing()
  const isTr = locale !== 'en'
  const planPrices = {
    starter: planPrice('STARTER').formatted,
    pro: planPrice('PRO').formatted,
    business: planPrice('BUSINESS').formatted,
  }
  const d = getDashboardMessages(isTr ? 'tr' : 'en')
  const groups = getDashboardNavGroups(d)
  const items = useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, groupTitle: g.title }))),
    [groups],
  )
  const step = useSteps(items.length, 2200)
  const active = items[step]
  const hint = HINTS[active.href]
  const activeRef = useRef<HTMLButtonElement>(null)
  const asideRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = activeRef.current
    const aside = asideRef.current
    if (!el || !aside) return
    const asideRect = aside.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const relativeTop = elRect.top - asideRect.top + aside.scrollTop
    const target = relativeTop - aside.clientHeight / 2 + el.offsetHeight / 2
    aside.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [step])

  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      <DemoChrome url={`gulivechat.com${active.href}`} className="max-w-none">
        <div className="flex min-h-[380px] sm:min-h-[420px]">
          {/* Sidebar — tüm menü */}
          <aside
            ref={asideRef}
            className="w-[148px] sm:w-[168px] shrink-0 bg-[#0b1120] border-r border-white/5 overflow-y-auto max-h-[420px] scrollbar-thin overscroll-contain"
          >
            <div className="p-2.5 border-b border-white/5">
              <p className="text-[10px] font-bold text-violet-300 truncate">Gu Live Chat</p>
              <p className="text-[9px] text-slate-500 truncate">sizin-siteniz.com</p>
            </div>
            {groups.map((group) => (
              <div key={group.title} className="py-1">
                <p className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">{group.title}</p>
                {group.items.map((item) => {
                  const isActive = item.href === active.href
                  const Icon = ICONS[item.icon] ?? Settings
                  const idx = items.findIndex((i) => i.href === item.href)
                  return (
                    <button
                      key={item.href}
                      ref={isActive ? activeRef : undefined}
                      type="button"
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 mx-1 rounded-lg text-left transition-all duration-300 ${
                        isActive
                          ? 'bg-violet-600/90 text-white shadow-md shadow-violet-900/40 scale-[1.02]'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                      style={{ width: 'calc(100% - 8px)' }}
                      onClick={() => {}}
                      tabIndex={-1}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      )}
                      {!isActive && idx < step && (
                        <span className="ml-auto w-1 h-1 rounded-full bg-emerald-500/60 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </aside>

          {/* Ana panel — geçişli içerik */}
          <div className="flex-1 min-w-0 bg-slate-50/80 flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 truncate">{active.label}</p>
              <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                {step + 1} / {items.length}
              </span>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <div
                key={active.href}
                className="absolute inset-0 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <PanelContent href={active.href} isTr={isTr} planPrices={planPrices} />
              </div>
            </div>
          </div>
        </div>
      </DemoChrome>

      {/* Aktif menü açıklaması */}
      <div
        key={`hint-${active.href}`}
        className="mt-5 text-center px-4 animate-in fade-in duration-300"
      >
        <p className="text-lg font-bold text-slate-900">{active.label}</p>
        <p className="mt-1 text-sm text-slate-600 max-w-lg mx-auto">
          {hint ? (isTr ? hint.tr : hint.en) : active.groupTitle}
        </p>
        <div className="flex justify-center gap-1 mt-4 flex-wrap max-w-md mx-auto">
          {items.map((item, i) => (
            <span
              key={item.href}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-violet-600' : i < step ? 'w-1.5 bg-violet-300' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
