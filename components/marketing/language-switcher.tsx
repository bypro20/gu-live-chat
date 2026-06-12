'use client'

import { Globe } from 'lucide-react'
import { useLocale } from '@/components/marketing/locale-provider'
import type { SiteLocale } from '@/lib/regional-config'
import { regionConfig } from '@/lib/regional-config'

const options: { locale: SiteLocale; label: string }[] = [
  { locale: 'tr', label: 'Türkçe' },
  { locale: 'en', label: 'English' },
]

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, region, setLocale } = useLocale()
  const cfg = regionConfig(region)

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'px-1'}`}>
      {!compact && (
        <span className="hidden sm:inline text-xs text-muted-foreground" title={cfg.label}>
          {cfg.flag}
        </span>
      )}
      <Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
      <label className="sr-only">Language</label>
      <select
        value={locale}
        onChange={(e) => void setLocale(e.target.value as SiteLocale)}
        className="text-sm font-medium bg-transparent border border-border rounded-lg px-2 py-1.5 text-foreground cursor-pointer focus:ring-2 focus:ring-primary outline-none"
        aria-label="Language"
      >
        {options.map((o) => (
          <option key={o.locale} value={o.locale}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
