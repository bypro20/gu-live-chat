import Link from 'next/link'
import { SITE_LEGAL } from '@/lib/site-legal'

const socialItems = [
  { key: 'instagram' as const, label: 'Instagram', href: SITE_LEGAL.social.instagram },
  { key: 'linkedin' as const, label: 'LinkedIn', href: SITE_LEGAL.social.linkedin },
  { key: 'youtube' as const, label: 'YouTube', href: SITE_LEGAL.social.youtube },
  { key: 'x' as const, label: 'X', href: SITE_LEGAL.social.x },
].filter((s) => s.href)

export function SocialLinksBar() {
  if (socialItems.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {socialItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
