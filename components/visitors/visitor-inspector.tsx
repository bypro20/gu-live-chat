'use client'

import { useMemo, useState } from 'react'
import {
  Activity as ActivityIcon, Clock, Globe2, Monitor, MousePointer2, Route, Smartphone, Tablet, Wifi, X,
  FileText, Keyboard, MoveVertical, Footprints,
} from 'lucide-react'
import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import { formatTimeAgo, getFaviconUrl } from '@/lib/visitors-utils'
import { visitorDisplayName } from '@/lib/visitor-live-geo'
import {
  deviceKindLabel,
  formatGeoSourceLabel,
  formatVisitorLocationLine,
  formatVisitorTechLine,
  resolveDeviceKind,
} from '@/lib/visitor-intelligence'
import { VisitorMapsLink } from '@/components/visitors/visitor-maps-link'
import { useVisitorsI18n } from '@/lib/hooks/use-visitors-i18n'

type Tab = 'journey' | 'details' | 'activity'

const TAB_LABEL = {
  tr: { journey: 'Yolculuk', details: 'Ayrıntı', activity: 'Etkinlik' },
  en: { journey: 'Journey', details: 'Details', activity: 'Activity' },
}

const COPY = {
  tr: {
    live: 'Canlı', lastSeen: 'Son görülme', onSite: 'Sitede', pages: 'Sayfa', device: 'Cihaz',
    now: 'Şu an', empty: 'Henüz hareket yok', device2: 'Cihaz', browser: 'Tarayıcı', location: 'Konum',
    source: 'Giriş kaynağı', direct: 'Doğrudan giriş', referrer: 'Yönlendiren', landing: 'İlk sayfa',
    ip: 'IP adresi', isp: 'Sağlayıcı', postal: 'Posta kodu', unknownLoc: 'Konum çözümleniyor…', close: 'Kapat',
    click: 'Tıkladı', scroll: 'Kaydırdı', input: 'Yazdı', typing: 'Yazıyor', pageview: 'Sayfa görüntüledi', other: 'Hareket',
  },
  en: {
    live: 'Live', lastSeen: 'Last seen', onSite: 'On site', pages: 'Pages', device: 'Device',
    now: 'Now', empty: 'No activity yet', device2: 'Device', browser: 'Browser', location: 'Location',
    source: 'Entry source', direct: 'Direct', referrer: 'Referrer', landing: 'Landing page',
    ip: 'IP address', isp: 'Provider', postal: 'Postal code', unknownLoc: 'Resolving location…', close: 'Close',
    click: 'Clicked', scroll: 'Scrolled', input: 'Typed', typing: 'Typing', pageview: 'Viewed page', other: 'Activity',
  },
}

function duration(from?: string): string {
  if (!from) return '—'
  const s = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 1000))
  if (s < 60) return `${s} sn`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} dk`
  return `${Math.floor(m / 60)} sa ${m % 60} dk`
}

function pathOf(url?: string): string {
  if (!url) return '—'
  try {
    const u = new URL(url, 'https://x.invalid')
    return u.pathname + (u.search || '')
  } catch {
    return url
  }
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
      <dt className="shrink-0 text-[11px] uppercase tracking-wider text-white/35">{label}</dt>
      <dd className={`min-w-0 text-right text-[13px] text-white/80 ${mono ? 'font-mono text-[12px]' : ''}`}>
        <span className="break-words">{value}</span>
      </dd>
    </div>
  )
}

export function VisitorInspector({
  visitor,
  activities,
  onClose,
}: {
  visitor: LiveVisitor
  activities: VisitorActivity[]
  onClose?: () => void
}) {
  const { locale } = useVisitorsI18n()
  const lang = locale === 'en' ? 'en' : 'tr'
  const c = COPY[lang]
  const [tab, setTab] = useState<Tab>('journey')

  const kind = resolveDeviceKind(visitor)
  const DeviceIcon = kind === 'mobile' ? Smartphone : kind === 'tablet' ? Tablet : Monitor
  const locationLine = formatVisitorLocationLine(visitor)
  const geoSource = formatGeoSourceLabel(visitor.geoSource)

  const journey = useMemo(() => {
    const fromPages = (visitor.pages ?? []).map((p) => ({ title: p.title, url: p.url, at: p.viewedAt }))
    if (fromPages.length > 0) return fromPages
    return activities
      .filter((a) => a.eventType === 'pageview' && a.url)
      .map((a) => ({ title: a.title ?? null, url: a.url as string, at: a.timestamp }))
  }, [visitor.pages, activities])

  const activityIcon = (t: VisitorActivity['eventType']) =>
    t === 'click' ? MousePointer2 : t === 'scroll' ? MoveVertical : t === 'input' || t === 'typing' ? Keyboard : t === 'pageview' ? FileText : Footprints
  const activityText = (a: VisitorActivity) => {
    if (a.eventType === 'pageview') return a.title || pathOf(a.url)
    if (a.eventType === 'click') return `${c.click}${a.text ? `: ${a.text}` : a.selector ? `: ${a.selector}` : ''}`
    if (a.eventType === 'scroll') return `${c.scroll}${a.scrollPercentage != null ? ` · %${Math.round(a.scrollPercentage)}` : ''}`
    if (a.eventType === 'input') return `${c.input}${a.fieldName ? ` · ${a.fieldName}` : ''}`
    if (a.eventType === 'typing') return c.typing
    return c.other
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-[#0a0813]/95 text-white backdrop-blur-xl">
      <header className="shrink-0 border-b border-white/[0.07] p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div
              className={`grid h-11 w-11 place-items-center rounded-full text-base font-semibold ${
                visitor.isLive
                  ? 'bg-gradient-to-br from-violet-400 to-teal-300 text-[#0a0813] shadow-[0_0_24px_-4px_rgba(167,139,250,.8)]'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {visitorDisplayName(visitor.name)[0]?.toUpperCase() ?? 'A'}
            </div>
            {visitor.isLive && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0813] bg-emerald-400" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{visitorDisplayName(visitor.name)}</p>
            {visitor.email && <p className="truncate text-xs text-white/45">{visitor.email}</p>}
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                visitor.isLive ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/8 text-white/50'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${visitor.isLive ? 'animate-pulse bg-emerald-400' : 'bg-white/40'}`} />
              {visitor.isLive ? c.live : c.lastSeen}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label={c.close} className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: c.onSite, v: duration(visitor.startedAt), I: Clock },
            { k: c.pages, v: String(journey.length || (visitor.currentPage ? 1 : 0)), I: Route },
            { k: c.device, v: deviceKindLabel(kind), I: DeviceIcon },
          ].map(({ k, v, I }) => (
            <div key={k} className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-2.5 py-2">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/35">
                <I className="h-3 w-3" />
                {k}
              </p>
              <p className="mt-1 truncate text-[13px] font-medium">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-400/[0.06] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-violet-200/60">{c.now}</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-violet-100">{visitor.currentTitle || pathOf(visitor.currentPage)}</p>
          <p className="truncate font-mono text-[11px] text-white/40">{pathOf(visitor.currentPage)}</p>
        </div>
      </header>

      <nav className="flex shrink-0 gap-1 border-b border-white/[0.07] px-3 pt-2" role="tablist">
        {(['journey', 'details', 'activity'] as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`relative px-3 py-2.5 text-[12px] font-medium transition ${tab === k ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {TAB_LABEL[lang][k]}
            {tab === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-300" />}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'journey' && (
          journey.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/35">{c.empty}</p>
          ) : (
            <ol className="relative space-y-4 border-l border-white/10 pl-5">
              {journey.slice(0, 20).map((p, i) => {
                const fav = getFaviconUrl(p.url)
                return (
                  <li key={`${p.url}-${p.at}-${i}`} className="relative">
                    <span
                      className={`absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full border ${
                        i === 0 ? 'border-violet-300 bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,.9)]' : 'border-white/25 bg-[#0a0813]'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      {fav && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fav} alt="" width={14} height={14} className="rounded-sm opacity-80" />}
                      <p className={`truncate text-[13px] ${i === 0 ? 'font-medium text-white' : 'text-white/70'}`}>{p.title || pathOf(p.url)}</p>
                    </div>
                    <p className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-white/35">
                      <span className="truncate font-mono">{pathOf(p.url)}</span>
                      <span className="shrink-0">{formatTimeAgo(p.at, lang)}</span>
                    </p>
                  </li>
                )
              })}
            </ol>
          )
        )}

        {tab === 'details' && (
          <dl>
            <Row label={c.location} value={locationLine || c.unknownLoc} />
            <Row label={c.device2} value={formatVisitorTechLine(visitor)} />
            <Row label={c.browser} value={[visitor.browser, visitor.os && visitor.os !== 'Unknown' ? visitor.os : null].filter(Boolean).join(' · ')} />
            <Row label={c.source} value={visitor.entrySource || c.direct} />
            <Row label={c.referrer} value={visitor.referrer} />
            <Row label={c.landing} value={visitor.landingPage ? pathOf(visitor.landingPage) : null} mono />
            <Row label={c.ip} value={visitor.ipAddress} mono />
            <Row label={c.isp} value={visitor.isp} />
            <Row label={c.postal} value={visitor.postalCode} />
            {geoSource && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/30"><Wifi className="h-3 w-3" />{geoSource}</p>}
            <div className="mt-4 flex items-center gap-2 text-[12px] text-violet-200">
              <Globe2 className="h-3.5 w-3.5" />
              <VisitorMapsLink visitor={visitor} />
            </div>
          </dl>
        )}

        {tab === 'activity' && (
          activities.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/35">{c.empty}</p>
          ) : (
            <ul className="space-y-1.5">
              {activities.slice(0, 40).map((a, i) => {
                const I = activityIcon(a.eventType)
                return (
                  <li key={`${a.timestamp}-${i}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] transition hover:bg-white/[0.04]">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.06] text-white/50">
                      <I className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white/75">{activityText(a)}</span>
                    <span className="shrink-0 text-[10px] text-white/30">{formatTimeAgo(a.timestamp, lang)}</span>
                  </li>
                )
              })}
            </ul>
          )
        )}
      </div>

      <footer className="shrink-0 border-t border-white/[0.07] px-4 py-2.5 text-[10px] text-white/25">
        <span className="inline-flex items-center gap-1.5">
          <ActivityIcon className="h-3 w-3" /> Gu Live Chat
        </span>
      </footer>
    </aside>
  )
}
