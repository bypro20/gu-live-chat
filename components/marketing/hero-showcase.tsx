'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Send, Bell, Zap, Shield, Clock } from 'lucide-react'

/** Crisp / Tidio tarzı: müşteri sitesi + widget + mobil sohbet — tek profesyonel kompozit */
export function HeroShowcase() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % 4), 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative w-full max-w-[540px] mx-auto lg:mx-0 lg:ml-auto">
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-cyan-400/15 rounded-[3rem] blur-3xl pointer-events-none" />

      {/* Browser — müşteri web sitesi */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/90">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500 font-medium">
              sizin-siteniz.com
            </div>
          </div>
        </div>

        <div className="relative h-[220px] sm:h-[240px] bg-gradient-to-br from-slate-50 to-white p-5 overflow-hidden">
          <div className="h-3 w-24 rounded bg-slate-200/80 mb-4" />
          <div className="h-2 w-full max-w-[200px] rounded bg-slate-100 mb-2" />
          <div className="h-2 w-full max-w-[160px] rounded bg-slate-100 mb-6" />
          <div className="grid grid-cols-3 gap-2 max-w-[280px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-slate-100/90 border border-slate-100" />
            ))}
          </div>

          {/* Site üzerinde açık widget */}
          <div
            className={`absolute bottom-3 right-3 w-[min(220px,58%)] rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-500/15 overflow-hidden transition-all duration-500 ${
              step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <div className="px-3 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white leading-none">Gu Live Chat</p>
                <p className="text-[8px] text-white/80 mt-0.5">Genelde birkaç saniye içinde yanıt</p>
              </div>
            </div>
            <div className="p-2.5 space-y-2 bg-slate-50/80 min-h-[72px]">
              <div
                className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
              >
                <div className="bg-white border border-slate-100 rounded-xl rounded-tl-sm px-2.5 py-1.5 max-w-[85%] shadow-sm">
                  <p className="text-[9px] text-slate-700">Merhaba, bu ürün stokta mı?</p>
                </div>
              </div>
              <div
                className={`flex justify-end transition-all duration-500 delay-150 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
              >
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl rounded-tr-sm px-2.5 py-1.5 max-w-[88%] shadow-sm">
                  <p className="text-[9px] text-white">Evet, hemen sipariş verebilirsiniz ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil — aynı sohbet */}
      <div
        className={`absolute -left-2 sm:-left-6 bottom-8 sm:bottom-4 w-[132px] sm:w-[148px] transition-all duration-700 ${
          step >= 0 ? 'opacity-100 translate-y-0 rotate-[-6deg]' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="rounded-[1.4rem] border-[3px] border-slate-800 bg-slate-900 p-1 shadow-2xl shadow-slate-900/25">
          <div className="rounded-[1.1rem] overflow-hidden bg-white">
            <div className="h-5 bg-slate-900 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-slate-700" />
            </div>
            <div className="px-2 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600">
              <p className="text-[7px] font-bold text-white">Gu Live Chat</p>
            </div>
            <div className="p-2 space-y-1.5 bg-slate-50 min-h-[100px]">
              <div className="bg-white border border-slate-100 rounded-lg px-2 py-1">
                <p className="text-[6.5px] text-slate-600">Yeni mesaj!</p>
              </div>
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg px-2 py-1 ml-auto max-w-[90%]">
                <p className="text-[6.5px] text-white">Size yardımcı olalım</p>
              </div>
            </div>
            <div className="px-2 pb-2 flex items-center gap-1 border-t border-slate-100 pt-1.5">
              <div className="flex-1 h-4 rounded-md bg-slate-100" />
              <Send className="w-3 h-3 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Bildirim kartı */}
      <div
        className={`absolute -right-1 sm:-right-4 top-16 sm:top-12 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-lg flex items-center gap-2 transition-all duration-500 ${
          step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <Bell className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-800">Yeni sohbet</p>
          <p className="text-[9px] text-slate-500">Ayşe K. · 2 sn önce</p>
        </div>
      </div>

      {/* Metrik chip */}
      <div className="absolute -right-2 sm:right-0 -bottom-3 px-3 py-1.5 rounded-full bg-white border border-indigo-100 shadow-md text-[10px] font-semibold text-indigo-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        3 temsilci çevrimiçi
      </div>
    </div>
  )
}

export function HeroTrustPills() {
  const pills = [
    { icon: Clock, label: '30 sn kurulum' },
    { icon: Shield, label: 'KVKK uyumlu' },
    { icon: Zap, label: 'Anında bildirim' },
  ]
  return (
    <ul className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
      {pills.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 bg-white/80 border border-slate-200/80 shadow-sm"
        >
          <Icon className="w-3.5 h-3.5 text-indigo-500" />
          {label}
        </li>
      ))}
    </ul>
  )
}
