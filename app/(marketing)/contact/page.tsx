'use client'

import { useState } from 'react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { useToast } from '@/lib/toast'
import { Mail, MessageSquare, Phone } from 'lucide-react'

export default function ContactPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    toast({
      title: 'Mesajınız alındı',
      description: 'En kısa sürede size dönüş yapacağız.',
      variant: 'success',
    })
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">İletişim</p>
        <h1 className="text-4xl font-bold tracking-tight">Bize ulaşın</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Sorularınız, demo talepleri veya kurumsal çözümler için ekibimizle iletişime geçin.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Mail, label: 'E-posta', value: 'destek@guchat.org' },
          { icon: MessageSquare, label: 'Canlı Destek', value: 'guchat.org üzerinden' },
          { icon: Phone, label: 'Kurumsal', value: 'Demo talep formu' },
        ].map((item) => (
          <div key={item.label} className="surface p-4 text-center">
            <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="surface p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Ad Soyad</label>
            <input required name="name" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">E-posta</label>
            <input required type="email" name="email" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Konu</label>
          <select name="subject" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30">
            <option>Genel Bilgi</option>
            <option>Demo Talebi</option>
            <option>Kurumsal Çözüm</option>
            <option>Teknik Destek</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Mesaj</label>
          <textarea required name="message" rows={4} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto disabled:opacity-60">
          {loading ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>
    </MarketingPageShell>
  )
}
