'use client'

import { useMemo } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { SITE_LEGAL } from '@/lib/site-legal'

interface SocialShareProps {
  title: string
  path: string
  className?: string
}

export function SocialShare({ title, path, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const url = useMemo(() => `${SITE_LEGAL.url.replace(/\/$/, '')}${path}`, [path])

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: 'bg-[#0A66C2] text-white hover:opacity-90',
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'bg-slate-900 text-white hover:opacity-90',
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-[#1877F2] text-white hover:opacity-90',
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      className: 'bg-[#25D366] text-white hover:opacity-90',
    },
  ]

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
        <Share2 className="w-3.5 h-3.5" />
        Paylaş
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity ${l.className}`}
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Kopyalandı' : 'Link'}
      </button>
    </div>
  )
}
