'use client'

import Link from 'next/link'
import { Download } from 'lucide-react'

const APK_URL = '/downloads/guchat.apk'

/** Mobilde her zaman görünen sabit Android indirme çubuğu */
export function MobileAndroidBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[60] border-t border-emerald-500/20 bg-background/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <a
          href={APK_URL}
          download="GuChat.apk"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
        >
          <Download className="w-5 h-5 shrink-0" />
          Android Uygulamayı İndir — Ücretsiz
        </a>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5">
          Evde, işte, dışarıda — müşterilerinizle konuşmaya devam edin
        </p>
      </div>
    </div>
  )
}

/** Üst bar — mobil header içinde her zaman görünür */
export function MobileAndroidNavButton({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/mobil-indir"
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shrink-0"
    >
      <Download className="w-3.5 h-3.5" />
      İndir
    </Link>
  )
}
