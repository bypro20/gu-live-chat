'use client'
import Link from 'next/link'
export default function CerezPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">&larr; Ana Sayfa</Link>
        <h1 className="text-3xl font-bold mb-8">Çerez Politikası</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Bu site, size daha iyi bir kullanıcı deneyimi sunmak için çerezler kullanmaktadır.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Çerez Nedir?</h2>
          <p>Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin dosyalarıdır. Tercihlerinizi hatırlamak ve siteyi iyileştirmek için kullanılır.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Kullandığımız Çerez Türleri</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Zorunlu Çerezler:</strong> Sitenin düzgün çalışması için gereklidir. Oturum ve güvenlik çerezleri.</li>
            <li><strong>Performans Çerezleri:</strong> Site kullanım istatistiklerini toplar (Google Analytics).</li>
            <li><strong>İşlevsel Çerezler:</strong> Dil ve tema tercihlerinizi hatırlar.</li>
            <li><strong>Hedefleme Çerezleri:</strong> Size özel içerik ve reklam gösterimi için kullanılır.</li>
          </ul>
          <h2 className="text-xl font-semibold text-foreground mt-8">Çerez Yönetimi</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Ancak bazı çerezleri devre dışı bırakmanız site işlevselliğini etkileyebilir.</p>
          <p className="mt-4">Detaylı bilgi için: info@gulivechat.com</p>
        </div>
      </div>
    </div>
  )
}
