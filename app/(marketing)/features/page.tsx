import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  MessageCircle,
  Bot,
  Users,
  BarChart3,
  Workflow,
  Blocks,
  Shield,
  Zap,
  Sparkles,
  Video,
  Phone,
  Megaphone,
  Inbox,
  BookOpen,
  Code,
  Languages,
} from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { buildMetadata, PAGE_SEO } from '@/lib/seo'
import { trialShortLabel } from '@/lib/trial-config'

export const metadata: Metadata = buildMetadata(PAGE_SEO.features)

const allFeatures = [
  {
    id: 'ai-agent',
    icon: Sparkles,
    title: 'AI Agent',
    desc: 'Standart talepleri anında işleyin. Bilgi bankası + LLM ile otomatik yanıt; temsilci atanınca devreye girer.',
  },
  {
    id: 'widget',
    icon: MessageCircle,
    title: 'Canlı Sohbet Widget',
    desc: 'WebSocket tabanlı anlık mesajlaşma, dosya paylaşımı, çeviri ve yazıyor göstergesi.',
  },
  {
    id: 'translate',
    icon: Languages,
    title: 'Canlı Çeviri (PRO)',
    desc: '50+ dilde çift yönlü anlık çeviri. Temsilci ve ziyaretçi farklı dillerde sorunsuz konuşur; admin panelde ücretsiz.',
  },
  {
    id: 'inbox',
    icon: Inbox,
    title: 'Birleşik Gelen Kutusu',
    desc: 'Widget, WhatsApp, Instagram, Telegram, Messenger ve e-posta — tek panel, kanal rozeti ve filtre.',
  },
  {
    icon: Bot,
    title: 'AI Sohbet & Chatbot',
    desc: 'GPT/Gemini ile insan gibi yanıt (Profesyonel+). Görsel chatbot akışları, SSS ve workflow — alt paketlerde eklenti olarak.',
  },
  {
    icon: Sparkles,
    title: 'YZ Yazım Yardımcısı',
    desc: 'Temsilcilere AI öneri ile daha hızlı ve etkili mesajlar yazma desteği.',
  },
  {
    icon: Blocks,
    title: 'Çoklu Kanal (PRO)',
    desc: 'WhatsApp Business, Instagram DM, Facebook Messenger, Telegram ve e-posta entegrasyonu.',
  },
  {
    icon: Megaphone,
    title: 'Gu Pazarlama',
    desc: 'Kampanyalar, hedefli mesajlar ve proaktif sohbet ile trafiği müşteriye dönüştürün.',
  },
  {
    id: 'crm',
    icon: Users,
    title: 'Kişiler & Ziyaretçi CRM',
    desc: 'Profil, sohbet geçmişi, etiketler ve canlı ziyaretçi takibi. Veriler güvenli platformda.',
  },
  {
    icon: Video,
    title: 'Video & Ekran İzleme',
    desc: 'Ziyaretçi ekranını canlı izleyin, görüntülü destek ile ürünlerinizi gösterin (PRO).',
  },
  {
    icon: Phone,
    title: 'Telefon & SMS',
    desc: 'Twilio SMS entegrasyonu. Telefon+ sesli kanal yakında.',
  },
  {
    icon: BookOpen,
    title: 'Bilgi Bankası',
    desc: 'SSS ve makaleler — AI Agent ve chatbot için bağlam kaynağı.',
  },
  {
    icon: Workflow,
    title: 'Workflow Otomasyonu',
    desc: 'Tetikleyici ve aksiyon tabanlı otomatik yanıt akışları.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analitik & Performans',
    desc: 'Kanal dağılımı, temsilci sıralaması, yanıt süresi ve AI çözüm oranı.',
  },
  {
    icon: Code,
    title: 'API & Entegrasyonlar',
    desc: 'REST API, webhook ve hazır entegrasyonlar. CRM ve özel yazılımlara bağlanın.',
  },
  {
    icon: Shield,
    title: 'Güvenlik',
    desc: 'SSL/TLS, KVKK, rol tabanlı erişim. İş hesap şifrelerini paylaşmadan güvenli destek.',
  },
  {
    icon: Zap,
    title: 'Hızlı Kurulum',
    desc: 'Tek satır embed kodu — 30 saniyede sitenize entegre edin.',
  },
]

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Özellikler</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Müşteri hizmetleri için tek çözüm
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Çok kanallı destek, AI Agent ve birleşik inbox — Gu Chat ile hepsi tek platformda.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {allFeatures.map((f) => (
          <div key={f.title} id={'id' in f ? f.id : undefined} className="surface p-5 scroll-mt-28">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5" />
            </div>
            <h2 className="font-semibold mb-2">{f.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="surface p-8 text-center bg-gradient-brand-subtle">
        <h2 className="text-xl font-bold mb-2">{trialShortLabel()} — hemen başlayın</h2>
        <p className="text-sm text-muted-foreground mb-5">Kredi kartı gerekmez · Kurulum 30 saniye</p>
        <Link href="/register" className="btn-primary">
          Ücretsiz Başla <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
