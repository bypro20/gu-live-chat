import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { getServerLocaleContext } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  const isTr = locale !== 'en'
  return buildMetadata({
    title: isTr ? 'Canlı Demo — Panel Turu | Gu Live Chat' : 'Live Demo — Panel Tour | Gu Live Chat',
    description: isTr
      ? 'Gu Live Chat panelinde menüler ne işe yarar? Kısa video turu ile Gelen Kutusu, Widget, Analitik ve daha fazlasını keşfedin.'
      : 'What does each menu do in Gu Live Chat? Watch a short panel tour covering Inbox, Widget, Analytics, and more.',
    path: '/demo',
  })
}

const MENU_TR = [
  { title: 'Genel Bakış', desc: 'Açık sohbetler, ziyaretçiler ve günlük performans özeti.' },
  { title: 'Gelen Kutusu', desc: 'Tüm kanallardan gelen mesajlara anında yanıt verin.' },
  { title: 'Kişiler', desc: 'Müşteri geçmişi, iletişim bilgileri ve etiketler.' },
  { title: 'Ziyaretçiler & Analitik', desc: 'Canlı ziyaretçi listesi, dönüşüm ve yanıt süresi raporları.' },
  { title: 'Widget & Kanallar', desc: 'Tek satır kodla widget ekleyin; WhatsApp ve e-posta bağlayın.' },
  { title: 'Bilgi Bankası & Chatbot', desc: 'SSS makaleleri, AI yanıtları ve otomasyon kuralları.' },
  { title: 'Ekip & Planlar', desc: 'Temsilci davet edin, paketinizi ve faturanızı yönetin.' },
]

const MENU_EN = [
  { title: 'Overview', desc: 'Open chats, live visitors, and daily performance at a glance.' },
  { title: 'Inbox', desc: 'Reply instantly to messages from every channel.' },
  { title: 'Contacts', desc: 'Customer history, contact details, and tags.' },
  { title: 'Visitors & Analytics', desc: 'Live visitor list, conversion, and response-time reports.' },
  { title: 'Widget & Channels', desc: 'Embed the widget with one line; connect WhatsApp and email.' },
  { title: 'Knowledge Base & Chatbot', desc: 'Help articles, AI replies, and automation workflows.' },
  { title: 'Team & Plans', desc: 'Invite agents and manage your subscription.' },
]

export default async function DemoPage() {
  const { locale } = await getServerLocaleContext()
  const isTr = locale !== 'en'
  const menus = isTr ? MENU_TR : MENU_EN

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-fuchsia-50/40">
      <header className="border-b border-border/60 px-4 py-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo boyut="default" linkOlsun animasyonlu={false} />
          <Link href="/register" className="text-sm font-semibold text-primary hover:underline">
            {isTr ? 'Ücretsiz Başla' : 'Start Free'}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg mb-4">
            {isTr ? '🎬 Canlı Demo · Panel Turu' : '🎬 Live Demo · Panel Tour'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isTr ? 'Panelde neler yapılır?' : 'What can you do in the panel?'}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {isTr
              ? '“Canlı Demo Gör” dediğinizde göreceğiniz panel menülerini kısa videoda anlattık.'
              : 'A quick video walkthrough of every main menu in the Gu Live Chat dashboard.'}
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border shadow-xl bg-black aspect-[9/16] max-w-sm mx-auto mb-10">
          <video
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          >
            <source src="/gulivechat-panel-demo-tr.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {menus.map((m) => (
            <div key={m.title} className="surface p-5">
              <h2 className="font-bold text-foreground">{m.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="surface p-6 sm:p-8 text-center">
          <ul className="flex flex-wrap justify-center gap-3 mb-6 text-xs font-semibold">
            {(isTr
              ? ['14 gün PRO ücretsiz', 'Kredi kartı gerekmez', 'Kurulum 30 saniye']
              : ['14-day PRO trial', 'No credit card', '30-second setup']
            ).map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
                <Check className="w-3.5 h-3.5 text-success" />
                {p}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold">
            {isTr ? 'Ücretsiz Hesap Aç' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
