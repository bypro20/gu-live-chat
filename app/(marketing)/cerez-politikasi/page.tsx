'use client'

import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export default function CerezPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Çerez Politikası</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Bu site, size daha iyi bir kullanıcı deneyimi sunmak için çerezler kullanmaktadır.
        </p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Çerez Nedir?</h2>
          <p>Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin dosyalarıdır. Tercihlerinizi hatırlamak ve siteyi iyileştirmek için kullanılır.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Kullandığımız Çerez Türleri</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground font-semibold">Zorunlu Çerezler:</strong> Sitenin düzgün çalışması için gereklidir. Oturum ve güvenlik çerezleri.</li>
            <li><strong className="text-foreground font-semibold">Performans Çerezleri:</strong> Site kullanım istatistiklerini toplar (Google Analytics).</li>
            <li><strong className="text-foreground font-semibold">İşlevsel Çerezler:</strong> Dil ve tema tercihlerinizi hatırlar.</li>
            <li><strong className="text-foreground font-semibold">Hedefleme Çerezleri:</strong> Size özel içerik ve reklam gösterimi için kullanılır.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Çerez Yönetimi</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Ancak bazı çerezleri devre dışı bırakmanız site işlevselliğini etkileyebilir.</p>
          <p className="mt-4">Detaylı bilgi için: info@gulivechat.com</p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
