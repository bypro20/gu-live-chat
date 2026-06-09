import Link from 'next/link'
import { Shield, Globe, Copyright, Lock } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { IyzicoLegalBar } from '@/components/marketing/iyzico-legal-bar'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { SITE_LEGAL } from '@/lib/site-legal'

const columns = [
  {
    title: 'Ürün',
    links: [
      { label: 'Mobil Uygulama', href: '/mobil-indir' },
      { label: 'Canlı Destek', href: '/canli-destek' },
      { label: 'Chatbot', href: '/chatbot' },
      { label: 'WhatsApp Destek', href: '/whatsapp-destek' },
      { label: 'Özellikler', href: '/features' },
      { label: 'Entegrasyonlar', href: '/integrations' },
      { label: 'Fiyatlandırma', href: '/pricing' },
      { label: 'Apps & Eklentiler', href: '/apps' },
      { label: 'Yapay Zeka', href: '/ai' },
    ],
  },
  {
    title: 'Kaynaklar',
    links: [
      { label: 'Yardım Merkezi', href: '/help' },
      { label: 'Blog', href: '/blog' },
      { label: 'İletişim', href: '/contact' },
      { label: 'SSS', href: '/#faq' },
    ],
  },
  {
    title: 'Hesap',
    links: [
      { label: 'Giriş Yap', href: '/login' },
      { label: 'Kayıt Ol', href: '/register' },
      { label: 'Demo Talep Et', href: '/contact?konu=demo' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Gizlilik Sözleşmesi', href: '/gizlilik' },
      { label: 'Teslimat ve İade Şartları', href: '/teslimat-iade' },
      { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
      { label: 'Ödeme Güvenliği (SSL)', href: '/odeme-guvenligi' },
      { label: 'Kullanım Şartları', href: '/kullanim-sartlari' },
      { label: 'KVKK Aydınlatma', href: '/kvkk' },
      { label: 'Çerez Politikası', href: '/cerez-politikasi' },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Logo boyut="sm" linkOlsun animasyonlu={false} className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              {SITE_LEGAL.tagline}. Canlı sohbet, AI asistan ve birleşik inbox — Türk yapımı.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{col.title}</h4>
              <div className="space-y-2.5">
                {col.links.map((link) => (
                  <Link key={link.label} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border space-y-8">
          <IyzicoLegalBar />
          <div className="flex justify-center">
            <PaymentLogos variant="footer" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Copyright className="w-3.5 h-3.5" />
              <span>Gu Chat © 2026</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" />256-bit SSL</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" />KVKK Uyumlu</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />Türkiye&apos;de Üretildi</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full" />99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
