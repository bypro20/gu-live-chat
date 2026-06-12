'use client'

import Link from 'next/link'
import {
  MessageCircle,
  Megaphone,
  Sparkles,
  Video,
  Phone,
  ArrowRight,
} from 'lucide-react'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

const icons = [MessageCircle, Megaphone, Sparkles, Sparkles, Video, Phone]
const colors = ['#25D366', '#6366F1', '#1972F5', '#8B5CF6', '#EC4899', '#F97316']
const hrefs = [
  '/settings/channels',
  '/settings/campaigns',
  '/settings/chatbot',
  '/inbox',
  '/visitors',
  '/settings/channels',
]

export function GrowthOpportunities() {
  const { growth } = useDashboardI18n()

  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">{growth.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{growth.subtitle}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {growth.items.map((item, idx) => {
          const Icon = icons[idx]
          const badge = idx === 5 ? growth.comingSoon : item.badge
          return (
            <Link
              key={item.title}
              href={hrefs[idx]}
              className="group p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: colors[idx] }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                    {badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
