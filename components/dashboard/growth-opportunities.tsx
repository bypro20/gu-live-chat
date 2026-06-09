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

const items = [
  {
    href: '/settings/channels',
    icon: MessageCircle,
    color: '#25D366',
    title: 'WhatsApp & Sosyal',
    desc: 'WhatsApp, Instagram, Telegram ve Messenger\'ı tek gelen kutusuna bağlayın.',
    badge: 'PRO',
  },
  {
    href: '/settings/campaigns',
    icon: Megaphone,
    color: '#6366F1',
    title: 'Gu Pazarlama',
    desc: 'Trafiği hedefli potansiyel müşterilere dönüştürün, kampanyalar gönderin.',
    badge: 'PRO',
  },
  {
    href: '/settings/chatbot',
    icon: Sparkles,
    color: '#1972F5',
    title: 'AI Agent',
    desc: 'Standart talepleri otomatik yanıtlayın, ekibinize zaman kazandırın.',
    badge: 'PRO',
  },
  {
    href: '/inbox',
    icon: Sparkles,
    color: '#8B5CF6',
    title: 'YZ Yazım Yardımcısı',
    desc: 'Gelen kutusunda AI öneri ile daha hızlı ve etkili yanıtlar yazın.',
    badge: null,
  },
  {
    href: '/visitors',
    icon: Video,
    color: '#EC4899',
    title: 'Video & Ekran',
    desc: 'Ziyaretçi ekranını canlı izleyin, görüntülü destek sunun.',
    badge: 'PRO',
  },
  {
    href: '/settings/channels',
    icon: Phone,
    color: '#F97316',
    title: 'Telefon & SMS',
    desc: 'Twilio SMS entegrasyonu ile sesli ve yazılı kanalları birleştirin.',
    badge: 'Yakında',
  },
]

export function GrowthOpportunities() {
  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">İşletmeniz için fırsatlar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Satış ve desteği artıran ek özellikler
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: item.color }}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {item.badge}
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
        ))}
      </div>
    </div>
  )
}
