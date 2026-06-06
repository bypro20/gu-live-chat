'use client'

import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export default function KullanimPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Kullanım Şartları</h1>
        <p className="mt-4 text-sm text-muted-foreground">Son güncelleme: 2026</p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">1. Hizmet Kullanımı</h2>
          <p>Gu Live Chat hizmetlerini kullanarak bu şartları kabul etmiş olursunuz. Hizmetimizi yalnızca yasal amaçlar için kullanabilirsiniz.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">2. Hesap Güvenliği</h2>
          <p>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Hesabınızda gerçekleşen tüm aktivitelerden siz sorumlusunuz.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">3. Abonelik ve Ödemeler</h2>
          <p>Abonelikler aylık/yıllık olarak faturalandırılır. İptal durumunda, faturalandırılan dönemin sonuna kadar hizmet devam eder.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">4. Hizmet Kesintisi</h2>
          <p>Planlı bakım veya mücbir sebepler dışında %99.9 hizmet sürekliliği sağlarız. Kesintilerden doğabilecek zararlardan sorumlu değiliz.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">5. Fikri Mülkiyet</h2>
          <p>Platformun tüm hakları Gu Live Chat&apos;e aittir. İzinsiz kopyalama, dağıtma veya tersine mühendislik yasaktır.</p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
