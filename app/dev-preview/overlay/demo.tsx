'use client'

import { OverlayPreview } from '@/components/visitors/overlay-preview'
import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'

const svg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#f5f3ff"/><stop offset="1" stop-color="#ede9fe"/></linearGradient></defs><rect width="1600" height="800" fill="url(#g)"/><rect width="1600" height="64" fill="#fff"/><text x="40" y="40" font-family="sans-serif" font-size="22" font-weight="700" fill="#4c1d95">Atölye Mavi</text><text x="120" y="300" font-family="sans-serif" font-size="64" font-weight="700" fill="#1e1b4b">El yapımı seramik</text><text x="120" y="370" font-family="sans-serif" font-size="64" font-weight="700" fill="#7c3aed">koleksiyonu</text><rect x="120" y="430" width="260" height="64" rx="14" fill="#7c3aed"/><text x="160" y="472" font-family="sans-serif" font-size="24" fill="#fff">Sepete ekle</text><rect x="1000" y="180" width="440" height="460" rx="28" fill="#c4b5fd"/></svg>`,
)
const now = Date.now()
const visitor: LiveVisitor = {
  visitorId: 'v1', name: 'Selin K.', email: 'selin@ornek.com', browser: 'Chrome', os: 'macOS', device: 'Desktop', deviceType: 'desktop',
  country: 'TR', city: 'İzmir', currentPage: 'https://atolyemavi.com/odeme', currentTitle: 'Ödeme', landingPage: 'https://atolyemavi.com/',
  referrer: 'https://google.com', startedAt: new Date(now - 4 * 60000).toISOString(), lastActiveAt: new Date(now - 2000).toISOString(),
  isLive: true, websiteId: 'w1', ipAddress: '88.241.10.4', entrySource: 'Google', isp: 'Turkcell',
  pages: [
    { title: 'Ödeme', url: 'https://atolyemavi.com/odeme', viewedAt: new Date(now - 20000).toISOString() },
    { title: 'Sepet', url: 'https://atolyemavi.com/sepet', viewedAt: new Date(now - 60000).toISOString() },
    { title: 'Seramik set', url: 'https://atolyemavi.com/urunler/seramik-set', viewedAt: new Date(now - 120000).toISOString() },
    { title: 'Ana sayfa', url: 'https://atolyemavi.com/', viewedAt: new Date(now - 230000).toISOString() },
  ],
  viewportW: 1600, viewportH: 800, cursorX: 420, cursorY: 360, scrollY: 120, documentH: 2400,
  screenshotUrl: `data:image/svg+xml;utf8,${svg}`,
}
const activities: VisitorActivity[] = [
  { visitorId: 'v1', eventType: 'click', text: 'Sepete ekle', timestamp: new Date(now - 8000).toISOString() },
  { visitorId: 'v1', eventType: 'scroll', scrollPercentage: 34, timestamp: new Date(now - 15000).toISOString() },
  { visitorId: 'v1', eventType: 'pageview', title: 'Ödeme', url: 'https://atolyemavi.com/odeme', timestamp: new Date(now - 20000).toISOString() },
]

export function OverlayPreviewDemo() {
  return (
    <div className="dark min-h-screen bg-[#07060d] p-6">
      <div className="mx-auto h-[720px] max-w-[1280px]">
        <OverlayPreview
          visitor={visitor}
          recentClicks={[]}
          activities={activities}
          theme="admin"
          isScreenCapturing
          onScreenCaptureToggle={() => {}}
        />
      </div>
    </div>
  )
}
