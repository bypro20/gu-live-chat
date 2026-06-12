'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download, Shield, Bell, MessageCircle } from 'lucide-react'
import { useT } from '@/components/marketing/locale-provider'
import { APK_DOWNLOAD_FILENAME, APK_DOWNLOAD_PATH } from '@/lib/site-config'

const APK_URL = APK_DOWNLOAD_PATH
const VERSION = '1.2.0'

const FEATURE_ICONS = [MessageCircle, Bell, Shield] as const

export function MobilIndirContent() {
  const m = useT().home.mobilPage

  return (
    <>
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 rounded-[1.75rem] overflow-hidden shadow-xl shadow-blue-500/30 ring-1 ring-black/5">
          <Image
            src="/app-icon.png"
            alt={m.iconAlt}
            width={96}
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <p className="section-label mb-4">{m.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{m.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{m.subtitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {m.versionNote.replace('{version}', VERSION)}
        </p>

        <a
          href={APK_URL}
          download={APK_DOWNLOAD_FILENAME}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 text-base mt-8 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/25"
        >
          <Download className="w-5 h-5" />
          {m.download}
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          {m.noAccount}{' '}
          <Link href="/register" className="text-primary hover:underline">
            {m.registerLink}
          </Link>
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-12">
        {m.features.map(({ title, desc }, i) => {
          const Icon = FEATURE_ICONS[i] ?? MessageCircle
          return (
            <div key={title} className="surface p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-sm mb-1">{title}</h2>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          )
        })}
      </div>

      <section className="surface p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">{m.installTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
          {m.installWarning}
        </p>
        <ol className="space-y-4 text-sm text-muted-foreground">
          {m.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="text-center p-6 rounded-2xl bg-muted/40 border border-border">
        <p className="text-sm text-muted-foreground mb-4">{m.iphoneNote}</p>
        <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {m.webLogin} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </>
  )
}
