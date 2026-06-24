'use client'

import Link from 'next/link'
import { useT } from '@/components/marketing/locale-provider'

export function IyzicoLegalBar() {
  const links = useT().footerExtended.iyzicoLinks

  return (
    <nav
      aria-label="Legal pages"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm"
    >
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-4">
          {i > 0 && <span className="hidden sm:inline text-slate-300">|</span>}
          <Link href={link.href} className="text-slate-600 hover:text-slate-900 transition-colors">
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}
