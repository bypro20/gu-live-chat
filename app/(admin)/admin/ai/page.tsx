'use client'

import Link from 'next/link'
import { Bot, BookOpen, Mic, BarChart3, Inbox, ArrowRight } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

const CARDS = [
  {
    href: '/admin/ai/chatbot',
    icon: Bot,
    title: 'AI & Chatbot',
    desc: 'Sağlayıcı, model, otomatik yanıt, web araması, multimodal ve akıllı yönlendirme.',
  },
  {
    href: '/admin/ai/knowledge',
    icon: BookOpen,
    title: 'Bilgi Bankası & RAG',
    desc: 'Makaleler, PDF/URL eğitimi ve widget AI bağlamı.',
  },
  {
    href: '/admin/ai/voice',
    icon: Mic,
    title: 'Sesli AI',
    desc: 'Tarayıcıda konuşmalı asistan ve embed linki.',
  },
  {
    href: '/admin/ai/analytics',
    icon: BarChart3,
    title: 'AI Analitik',
    desc: 'Bot yanıtları, devir, duygu analizi ve RAG kullanımı.',
  },
  {
    href: '/admin/inbox',
    icon: Inbox,
    title: 'Gelen Kutusu + Copilot',
    desc: 'Widget sohbetlerinde AI öneri, kısaltma, çeviri ve yanıt asistanı.',
  },
] as const

export default function AdminAiHubPage() {
  const { activeWebsite } = useActiveWebsite()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 mb-8">
        <p className="text-sm font-semibold text-foreground">Platform admin — sınırsız AI</p>
        <p className="text-sm text-muted-foreground mt-1">
          {activeWebsite?.name || 'Marketing sitesi'} için tüm AI özellikleri plan limiti olmadan
          açıktır. Widget ziyaretçileri otomatik AI yanıt alır; siz gelen kutusunda Copilot kullanabilirsiniz.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-border bg-card p-5 hover:border-indigo-500/40 hover:shadow-md transition"
          >
            <card.icon className="w-8 h-8 text-indigo-500 mb-3" />
            <h2 className="font-semibold text-foreground group-hover:text-indigo-600 transition">
              {card.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{card.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 mt-3">
              Aç <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
