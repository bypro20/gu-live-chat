'use client'
import Link from 'next/link'
export default function KullanimPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">&larr; Ana Sayfa</Link>
        <h1 className="text-3xl font-bold mb-8">Kullanım Şartları</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Son güncelleme: 2026</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">1. Hizmet Kullanımı</h2>
          <p>Gu Live Chat hizmetlerini kullanarak bu şartları kabul etmiş olursunuz. Hizmetimizi yalnızca yasal amaçlar için kullanabilirsiniz.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">2. Hesap Güvenliği</h2>
          <p>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Hesabınızda gerçekleşen tüm aktivitelerden siz sorumludur.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">3. Abonelik ve Ödemeler</h2>
          <p>Abonelikler aylık/yıllık olarak faturalandırılır. İptal durumunda, faturalandırılan dönemin sonuna kadar hizmet devam eder.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">4. Hizmet Kesintisi</h2>
          <p>Planlı bakım veya mücbir sebepler dışında %99.9 hizmet sürekliliği sağlarız. Kesintilerden doğabilecek zararlardan sorumlu değiliz.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">5. Fikri Mülkiyet</h2>
          <p>Platformun tüm hakları Gu Live Chat'e aittir. İzinsiz kopyalama, dağıtma veya tersine mühendislik yasaktır.</p>
        </div>
      </div>
    </div>
  )
}
