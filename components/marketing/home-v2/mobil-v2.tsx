'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowRight, Bell, Download, MessageCircle, Plus, Share, Shield, SquarePlus, EllipsisVertical } from 'lucide-react'
import { useLocale, useT } from '@/components/marketing/locale-provider'
import { APK_DOWNLOAD_FILENAME, APK_DOWNLOAD_PATH } from '@/lib/site-config'

type Platform = 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function usePlatform(): Platform {
  return useSyncExternalStore(
    () => () => {},
    detectPlatform,
    () => 'other',
  )
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const COPY = {
  tr: {
    badge: 'Mobil',
    title: 'Müşterilerin yazdığı an, cebinde.',
    sub: 'Android uygulamasını indir ya da iPhone ve Android’de ana ekrana ekleyerek uygulama gibi kullan. Bildirimleri kaçırma.',
    version: 'Sürüm',
    download: 'Android uygulamasını indir',
    noAccount: 'Hesabın yok mu?',
    register: 'Ücretsiz kayıt ol',
    homeTag: 'Ana ekrana ekle',
    homeTitle: 'Uygulama indirmeden, ana ekranda.',
    homeLead: 'Panelin simgesi telefonunun ana ekranına yerleşir, tam ekran açılır. Mağaza ya da kurulum gerekmez.',
    ios: 'iPhone',
    android: 'Android',
    iosSteps: [
      'Safari’de gulivechat.com adresini aç.',
      'Alttaki Paylaş düğmesine dokun.',
      'Listeden “Ana Ekrana Ekle” seçeneğini seç.',
      'Sağ üstten “Ekle”ye dokun.',
    ],
    androidSteps: [
      'Chrome’da gulivechat.com adresini aç.',
      'Sağ üstteki üç nokta menüsüne dokun.',
      '“Uygulamayı yükle” ya da “Ana ekrana ekle”yi seç.',
      'Onayla, simge ana ekranına gelir.',
    ],
    iosHint: 'iPhone’da yalnızca Safari ile çalışır.',
    installNow: 'Şimdi ana ekrana ekle',
    installed: 'Eklendi',
    panelNote: 'Giriş yaptıktan sonra panelin doğrudan açılır.',
    login: 'Panele giriş yap',
    appName: 'Gu Live Chat',
  },
  en: {
    badge: 'Mobile',
    title: 'The moment customers write, in your pocket.',
    sub: 'Download the Android app, or add it to your iPhone or Android home screen and use it like an app. Never miss a notification.',
    version: 'Version',
    download: 'Download the Android app',
    noAccount: 'No account yet?',
    register: 'Sign up free',
    homeTag: 'Add to home screen',
    homeTitle: 'No download, right on your home screen.',
    homeLead: 'The panel icon sits on your phone’s home screen and opens full screen. No store or installation needed.',
    ios: 'iPhone',
    android: 'Android',
    iosSteps: [
      'Open gulivechat.com in Safari.',
      'Tap the Share button at the bottom.',
      'Choose “Add to Home Screen” from the list.',
      'Tap “Add” at the top right.',
    ],
    androidSteps: [
      'Open gulivechat.com in Chrome.',
      'Tap the three-dot menu at the top right.',
      'Choose “Install app” or “Add to Home screen”.',
      'Confirm and the icon lands on your home screen.',
    ],
    iosHint: 'On iPhone this only works in Safari.',
    installNow: 'Add to home screen now',
    installed: 'Added',
    panelNote: 'After you sign in, your panel opens directly.',
    login: 'Sign in to the panel',
    appName: 'Gu Live Chat',
  },
}

const FEATURE_ICONS = [MessageCircle, Bell, Shield] as const
const VERSION = '1.2.0'

export function MobilV2() {
  const { locale } = useLocale()
  const c = locale === 'en' ? COPY.en : COPY.tr
  const m = useT().home.mobilPage
  const detected = usePlatform()
  const [picked, setPicked] = useState<'ios' | 'android' | null>(null)
  const tab: 'ios' | 'android' = picked ?? (detected === 'ios' ? 'ios' : 'android')
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallEvent)
    }
    const onInstalled = () => setDone(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const r = await prompt.userChoice
    if (r.outcome === 'accepted') setDone(true)
    setPrompt(null)
  }

  const steps = tab === 'ios' ? c.iosSteps : c.androidSteps

  return (
    <div className="hv2 bg-[#07060d] text-white">
      {/* Üst bölüm */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 text-center sm:px-6 sm:pt-40">
        <div className="hv2-aurora" aria-hidden="true" />
        <div className="hv2-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-7 h-24 w-24 overflow-hidden rounded-[1.75rem] ring-1 ring-white/15 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.7)]">
            <Image src="/app-icon.png" alt={m.iconAlt} width={96} height={96} className="h-full w-full object-cover" priority />
          </div>
          <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.badge}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">{c.title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty leading-relaxed text-white/60 sm:text-lg">{c.sub}</p>
          <p className="mt-3 text-xs text-white/35">
            {c.version} {VERSION}
          </p>
          <a
            href={APK_DOWNLOAD_PATH}
            download={APK_DOWNLOAD_FILENAME}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#07060d] transition hover:bg-white/90 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {c.download}
          </a>
          <p className="mt-4 text-xs text-white/40">
            {c.noAccount}{' '}
            <Link href="/register" className="text-violet-200 underline-offset-4 hover:underline">
              {c.register}
            </Link>
          </p>
        </div>

        <ul className="relative mx-auto mt-14 grid max-w-4xl gap-3 sm:grid-cols-3">
          {m.features.map(({ title, desc }, i) => {
            const Icon = FEATURE_ICONS[i] ?? MessageCircle
            return (
              <li key={title} className="hv2-card p-5 text-left">
                <Icon className="h-5 w-5 text-violet-300" />
                <h2 className="mt-3 text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-white/50">{desc}</p>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Ana ekrana ekle */}
      <section className="relative px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-violet-300/80">{c.homeTag}</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-4xl">
              {c.homeTitle}
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-white/55">{c.homeLead}</p>

            <div role="tablist" className="mt-8 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
              {(['ios', 'android'] as const).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setPicked(k)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    tab === k ? 'bg-white text-[#07060d]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {c[k]}
                </button>
              ))}
            </div>

            <ol className="mt-7 space-y-4">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-violet-300/40 font-mono text-[12px] text-violet-200">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-[15px] leading-snug text-white/75">
                    {s}
                    {tab === 'ios' && i === 1 && <Share className="ml-2 inline h-4 w-4 text-sky-300" />}
                    {tab === 'ios' && i === 2 && <SquarePlus className="ml-2 inline h-4 w-4 text-sky-300" />}
                    {tab === 'android' && i === 1 && <EllipsisVertical className="ml-2 inline h-4 w-4 text-sky-300" />}
                  </span>
                </li>
              ))}
            </ol>
            {tab === 'ios' && <p className="mt-5 text-xs text-white/40">{c.iosHint}</p>}

            {(prompt || done) && (
              <button
                onClick={install}
                disabled={done}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:bg-emerald-500/80"
              >
                <Plus className="h-4 w-4" />
                {done ? c.installed : c.installNow}
              </button>
            )}

            <p className="mt-8 text-sm text-white/45">
              {c.panelNote}{' '}
              <Link href="/login" className="inline-flex items-center gap-1 text-violet-200 hover:underline">
                {c.login} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>

          {/* Telefon çizimi */}
          <div className="mx-auto w-[260px]" aria-hidden="true">
            <div className="rounded-[2.4rem] border border-white/15 bg-[#0d0b16] p-3 shadow-[0_30px_100px_-30px_rgba(124,58,237,0.6)]">
              <div className="relative aspect-[9/13] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-[#241b45] via-[#15112a] to-[#0d0b16] p-5">
                <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/15" />
                <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/[0.07]" />
                  ))}
                  <div className="relative">
                    <div className="aspect-square overflow-hidden rounded-xl ring-2 ring-violet-300/70">
                      <Image src="/app-icon.png" alt="" width={56} height={56} className="h-full w-full object-cover" />
                    </div>
                    <span className="absolute -inset-1.5 animate-ping rounded-2xl border border-violet-300/40" />
                    <p className="mt-1 text-center text-[8px] text-white/70">{c.appName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
