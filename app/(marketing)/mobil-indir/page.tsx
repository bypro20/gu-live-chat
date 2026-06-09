import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download, Shield, Bell, MessageCircle } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Mobil Uygulama İndir — Gu Chat Android APK',
  description:
    'Gu Chat Android uygulamasını indirin. Gelen kutusu, anlık bildirimler ve müşteri mesajlarına telefondan yanıt verin. Ücretsiz APK.',
  path: '/mobil-indir',
  keywords: ['gu chat apk', 'canlı destek uygulaması', 'android indir'],
  ogImage: '/app-icon.png',
})

const APK_URL = '/downloads/guchat.apk'
const VERSION = '1.0.0'

export default function MobilIndirPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 rounded-[1.75rem] overflow-hidden shadow-xl shadow-blue-500/30 ring-1 ring-black/5">
          <Image
            src="/app-icon.png"
            alt="Gu Chat uygulama ikonu"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <p className="section-label mb-4">Mobil Uygulama</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gu Chat Android</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Müşteri mesajlarına telefondan anında yanıt verin. Gelen kutusu, bildirimler ve hızlı cevap — hepsi cebinizde.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Sürüm {VERSION} · Android 7.0+</p>

        <a
          href={APK_URL}
          download="GuChat.apk"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 text-base mt-8 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/25"
        >
          <Download className="w-5 h-5" />
          APK İndir (Android)
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          Henüz hesabınız yok mu?{' '}
          <Link href="/register" className="text-primary hover:underline">Ücretsiz kayıt olun</Link>
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-12">
        {[
          { icon: MessageCircle, title: 'Gelen Kutusu', desc: 'Tüm kanallardan mesajlar tek ekranda' },
          { icon: Bell, title: 'Anlık Bildirim', desc: 'Yeni mesaj gelince haberdar olun' },
          { icon: Shield, title: 'Güvenli', desc: 'SSL şifreleme, aynı panel güvenliği' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="surface p-5 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-sm mb-1">{title}</h2>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <section className="surface p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Kurulum adımları</h2>
        <ol className="space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span><strong className="text-foreground">APK İndir</strong> butonuna basın ve dosyayı kaydedin.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span>Telefonda <strong className="text-foreground">Ayarlar → Güvenlik → Bilinmeyen kaynaklardan yükleme</strong> iznini açın (veya indirme sırasında onaylayın).</span>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>İndirilen <strong className="text-foreground">GuChat.apk</strong> dosyasına dokunun ve <strong className="text-foreground">Yükle</strong> deyin.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
            <span>Uygulamayı açın, Gu Chat hesabınızla giriş yapın — hazırsınız!</span>
          </li>
        </ol>
      </section>

      <section className="text-center p-6 rounded-2xl bg-muted/40 border border-border">
        <p className="text-sm text-muted-foreground mb-4">iPhone kullanıyorsanız — yakında App Store. Şimdilik tarayıcıdan kullanabilirsiniz.</p>
        <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Web panelden giriş <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </MarketingPageShell>
  )
}
