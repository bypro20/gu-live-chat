'use client'

import Link from 'next/link'
import { ArrowRight, Puzzle, MessageCircle, Mail, BarChart3, Shield, Zap, ShoppingCart } from 'lucide-react'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'

const APP_ICONS = [MessageCircle, Zap, Shield, BarChart3, Mail, Puzzle] as const

export function AppsPageContent() {
  const { apps, common } = useMarketingPages()

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{apps.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{apps.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{apps.subtitle}</p>
        <Link href="/urunler#eklentiler" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline">
          {apps.catalogLink} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {apps.items.map((app, i) => {
          const Icon = APP_ICONS[i] ?? Puzzle
          const isPopular = app.status.toLowerCase().includes('pop') || app.status.toLowerCase().includes('popular')
          return (
            <div key={app.name} className="surface p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPopular ? 'bg-primary text-white' : 'bg-success-light text-success'
                }`}>{app.status}</span>
              </div>
              <h2 className="font-semibold mb-1">{app.name}</h2>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{app.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-bold text-sm">{app.price}</span>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {common.buyNow}
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-12 flex justify-center">
        <PaymentLogos variant="footer" />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">{apps.customAddon}</p>
        <Link href="/contact" className="btn-primary">
          {apps.contactCta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  )
}
