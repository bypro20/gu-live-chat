import Link from 'next/link'
import { AppLogo } from '@/components/brand/app-logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-background text-foreground">
      <AppLogo variant="light" showTagline={false} size="lg" />
      <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-center">Sayfa bulunamadı</h1>
      <p className="mt-3 text-muted-foreground text-center max-w-md">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
        >
          Ana sayfa
        </Link>
        <Link
          href="/help"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
        >
          Yardım
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
        >
          İletişim
        </Link>
      </div>
    </div>
  )
}
