'use client'

import Link from 'next/link'
import type { PlanFeature } from '@/lib/plan-shared'
import { FEATURE_ADDON_SLUG, MIN_PLAN_FOR_FEATURE } from '@/lib/plan-shared'

const FEATURE_TITLES: Partial<Record<PlanFeature, string>> = {
  chatbot: 'Chatbot',
  knowledgeBase: 'Bilgi Bankası',
  ticketing: 'Bilet Sistemi',
  webhooks: 'Webhook',
  workflows: 'Otomasyon',
  campaigns: 'Kampanyalar',
  cannedResponses: 'Hazır Cevaplar',
  statusPage: 'Durum Sayfası',
  apiAccess: 'API Erişimi',
  advancedAnalytics: 'Gelişmiş Analitik',
  visitorTracking: 'Ziyaretçi Takibi',
  aiAssistant: 'AI Asistan',
  overlayAI: 'Ekran İzleme',
  multiChannel: 'Çoklu Kanal',
  autoTranslate: 'Otomatik Çeviri',
  ratings: 'CSAT Puanlama',
  proactiveMessages: 'Hedefli Mesajlar',
}

const PLAN_NAMES = {
  STARTER: 'Başlangıç',
  PRO: 'Profesyonel',
  BUSINESS: 'Kurumsal',
} as const

interface PlanUpgradePromptProps {
  feature: PlanFeature
  description?: string
}

export default function PlanUpgradePrompt({ feature, description }: PlanUpgradePromptProps) {
  const requiredPlan = MIN_PLAN_FOR_FEATURE[feature] || 'PRO'
  const title = FEATURE_TITLES[feature] || feature
  const planName = PLAN_NAMES[requiredPlan as keyof typeof PLAN_NAMES] || requiredPlan

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[320px]">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">
          {description ||
            `Bu özellik ${planName} paketinde ve üzerinde kullanılabilir. Planınızı yükselterek hemen kullanmaya başlayın.`}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/settings/billing?plan=${requiredPlan}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Paketi Yükselt
          </Link>
          {FEATURE_ADDON_SLUG[feature] && (
            <Link
              href="/settings/addons"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--primary-light)]"
            >
              Eklenti Mağazası
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
