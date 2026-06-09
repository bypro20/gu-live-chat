'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { useToast } from '@/lib/toast'
import { SITE_LEGAL } from '@/lib/site-legal'
import { Mail, MessageSquare, Building2, MapPin, Phone, Clock } from 'lucide-react'

declare global {
  interface Window {
    $gu?: (...args: unknown[]) => void
  }
}

function openLiveChat() {
  if (typeof window !== 'undefined' && typeof window.$gu === 'function') {
    window.$gu('open')
    return true
  }
  return false
}

export function ContactPageClient() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const defaultSubject = searchParams.get('konu') === 'demo' ? 'Demo Talebi' : 'Genel Bilgi'
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState(defaultSubject)

  function focusFormWithSubject(nextSubject: string) {
    setSubject(nextSubject)
    document.getElementById('contact-subject')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => document.getElementById('contact-name')?.focus(), 300)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          subject: fd.get('subject'),
          message: fd.get('message'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gönderilemedi')
      toast({
        title: 'Mesajınız alındı',
        description: 'En kısa sürede size dönüş yapacağız.',
        variant: 'success',
      })
      form.reset()
    } catch (err) {
      toast({
        title: 'Gönderilemedi',
        description: err instanceof Error ? err.message : 'Bir hata oluştu',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleLiveChat() {
    if (!openLiveChat()) {
      toast({
        title: 'Canlı destek',
        description: 'Sağ alttaki sohbet balonunu kullanarak bize ulaşabilirsiniz.',
        variant: 'default',
      })
    }
  }

  const siteHost = SITE_LEGAL.url.replace(/^https?:\/\//, '')

  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">İletişim</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Bize ulaşın</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Sorularınız, demo talepleri veya kurumsal çözümler için ekibimizle iletişime geçin.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-4">
          <a
            href={`mailto:${SITE_LEGAL.email}`}
            className="surface p-5 flex items-start gap-4 hover:border-primary/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-posta</p>
              <p className="text-sm font-medium mt-1 text-foreground">{SITE_LEGAL.email}</p>
              <p className="text-xs text-muted-foreground mt-1">24 saat içinde yanıt</p>
            </div>
          </a>

          <button
            type="button"
            onClick={handleLiveChat}
            className="surface p-5 flex items-start gap-4 hover:border-primary/30 transition-colors group w-full text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/15 transition-colors">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canlı Destek</p>
              <p className="text-sm font-medium mt-1 text-foreground">{siteHost} üzerinden</p>
              <p className="text-xs text-primary mt-1">Sohbeti aç →</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => focusFormWithSubject('Kurumsal Çözüm')}
            className="surface p-5 flex items-start gap-4 hover:border-primary/30 transition-colors group w-full text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/15 transition-colors">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kurumsal</p>
              <p className="text-sm font-medium mt-1 text-foreground">Özel fiyatlandırma ve SLA</p>
              <p className="text-xs text-primary mt-1">Teklif iste →</p>
            </div>
          </button>

          <div className="surface p-5 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{SITE_LEGAL.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a href={`tel:${SITE_LEGAL.phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">
                {SITE_LEGAL.phone}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>{SITE_LEGAL.workingHours}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground px-1">
            <Link href="/hakkimizda" className="text-primary hover:underline">Kurumsal bilgiler</Link>
            {' · '}
            <Link href="/help" className="text-primary hover:underline">Yardım merkezi</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-3 surface p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mesaj gönderin</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Demo, kurumsal teklif veya teknik destek için formu doldurun.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium block mb-1.5">Ad Soyad</label>
              <input
                id="contact-name"
                required
                name="name"
                autoComplete="name"
                placeholder="Adınız Soyadınız"
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm font-medium block mb-1.5">E-posta</label>
              <input
                id="contact-email"
                required
                type="email"
                name="email"
                autoComplete="email"
                placeholder="ornek@sirket.com"
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="text-sm font-medium block mb-1.5">Konu</label>
            <select
              id="contact-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option>Genel Bilgi</option>
              <option>Demo Talebi</option>
              <option>Kurumsal Çözüm</option>
              <option>Teknik Destek</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="text-sm font-medium block mb-1.5">Mesaj</label>
            <textarea
              id="contact-message"
              required
              name="message"
              rows={5}
              placeholder="Size nasıl yardımcı olabiliriz?"
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            <p className="text-xs text-muted-foreground">
              Göndererek{' '}
              <Link href="/gizlilik" className="text-primary hover:underline">gizlilik sözleşmesini</Link>
              {' '}kabul etmiş olursunuz.
            </p>
          </div>
        </form>
      </div>
    </MarketingPageShell>
  )
}
