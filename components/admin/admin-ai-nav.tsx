'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: '/admin/ai', label: 'Genel Bakış', exact: true },
  { href: '/admin/ai/chatbot', label: 'AI & Chatbot' },
  { href: '/admin/ai/knowledge', label: 'Bilgi Bankası' },
  { href: '/admin/ai/voice', label: 'Sesli AI' },
  { href: '/admin/ai/analytics', label: 'AI Analitik' },
] as const

export function AdminAiNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">AI Platform</p>
            <p className="text-[11px] text-muted-foreground">Sınırsız kullanım — widget & inbox AI</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-0.5 sm:ml-auto">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition',
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
