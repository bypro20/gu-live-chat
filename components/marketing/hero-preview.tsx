'use client'

import { MessageCircle, Users, BarChart3, Inbox, Search, Send } from 'lucide-react'

/** Crisp tarzı statik ürün önizlemesi — sahte chatbot hissi vermez */
export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-4 bg-gradient-brand opacity-[0.06] rounded-2xl blur-2xl pointer-events-none" />
      <div className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-0.5 bg-background border border-border rounded-md text-[11px] text-muted-foreground font-medium">
              app.guchat.org/inbox
            </div>
          </div>
        </div>

        <div className="flex min-h-[340px] sm:min-h-[380px]">
          {/* Sidebar */}
          <div className="hidden sm:flex w-14 shrink-0 flex-col items-center gap-3 py-4 border-r border-border bg-[#0F172A]">
            {[Inbox, MessageCircle, Users, BarChart3].map((Icon, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  i === 0 ? 'bg-primary/20 text-primary' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>

          {/* Inbox list */}
          <div className="hidden md:block w-56 shrink-0 border-r border-border bg-muted/20">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-background border border-border rounded-lg">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ara...</span>
              </div>
            </div>
            {[
              { name: 'Ayşe K.', msg: 'Sipariş durumunu öğrenebilir miyim?', time: '2dk', active: true },
              { name: 'Mehmet D.', msg: 'Teşekkürler, sorun çözüldü', time: '14dk', active: false },
              { name: 'Zeynep A.', msg: 'Fatura bilgisi istiyorum', time: '1sa', active: false },
            ].map((c) => (
              <div
                key={c.name}
                className={`px-3 py-2.5 border-b border-border/60 cursor-default ${
                  c.active ? 'bg-primary-light/60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-semibold ${c.active ? 'text-primary' : 'text-foreground'}`}>{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{c.msg}</p>
              </div>
            ))}
          </div>

          {/* Conversation */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">A</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ayşe K.</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full" />
                  Çevrimiçi · guchat.org
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 bg-background">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">A</div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[75%]">
                  <p className="text-sm text-foreground">Sipariş durumunu öğrenebilir miyim?</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">14:32</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[75%]">
                  <p className="text-sm">Tabii! Sipariş numaranızı paylaşır mısınız?</p>
                  <span className="text-[10px] text-white/70 mt-1 block">14:33</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">A</div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[75%]">
                  <p className="text-sm text-foreground">#48291</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[75%]">
                  <p className="text-sm">Siparişiniz kargoya verildi. Takip: TR4829100</p>
                  <span className="text-[10px] text-white/70 mt-1 block">14:34 · Okundu</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border">
              <div className="flex gap-2 items-center px-3 py-2 bg-muted/40 border border-border rounded-xl">
                <span className="flex-1 text-sm text-muted-foreground">Yanıt yazın...</span>
                <Send className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
