'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download } from 'lucide-react'
import { useNativeApp } from '@/lib/hooks/use-native-app'
import { useT } from '@/components/marketing/locale-provider'

import { APK_DOWNLOAD_FILENAME, APK_DOWNLOAD_PATH } from '@/lib/site-config'

const APK_URL = APK_DOWNLOAD_PATH

/** Mobilde web tarayıcısında sabit Android indirme çubuğu */
export function MobileAndroidBar() {
  const { isNativeApp } = useNativeApp()
  const bar = useT().home.mobileBar
  const pathname = usePathname()
  if (isNativeApp || pathname === '/mobil-indir') return null

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[60] border-t border-white/10 bg-[#0d0b16]/95 backdrop-blur-xl">
      <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <a
          href={APK_URL}
          download={APK_DOWNLOAD_FILENAME}
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-semibold text-[#07060d] bg-white active:scale-[0.98] transition-transform"
        >
          <Download className="w-5 h-5 shrink-0" />
          {bar.download}
        </a>
        <p className="text-center text-[10px] text-white/40 mt-1.5">
          {bar.tagline}
        </p>
      </div>
    </div>
  )
}

/** Üst bar — mobil header içinde her zaman görünür (web) */
export function MobileAndroidNavButton({ onClick }: { onClick?: () => void }) {
  const { isNativeApp } = useNativeApp()
  const bar = useT().home.mobileBar
  if (isNativeApp) return null

  return (
    <Link
      href="/mobil-indir"
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#07060d] bg-white shrink-0"
    >
      <Download className="w-3.5 h-3.5" />
      {bar.navShort}
    </Link>
  )
}
