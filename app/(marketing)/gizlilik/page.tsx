'use client'
import Link from 'next/link'
export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">&larr; Ana Sayfa</Link>
        <h1 className="text-3xl font-bold mb-8">Gizlilik Politikası</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Son güncelleme: 2026</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">1. Toplanan Veriler</h2>
          <p>Gu Live Chat olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel verileri toplayabiliriz: ad, soyad, e-posta adresi, telefon numarası, IP adresi, tarayıcı bilgileri, cihaz bilgileri ve site kullanım verileri.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">2. Verilerin Kullanımı</h2>
          <p>Toplanan veriler; hizmet sağlama, müşteri desteği, hesap yönetimi, hizmet iyileştirme, analitik ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">3. Veri Paylaşımı</h2>
          <p>Verileriniz üçüncü taraflarla yalnızca hizmet sağlama amacıyla (ör. ödeme işlemleri, e-posta gönderimi) ve yasal zorunluluk hallerinde paylaşılır.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">4. Veri Saklama</h2>
          <p>Kişisel verileriniz, hizmet ilişkimiz devam ettiği sürece saklanır. Hesabınızı sildiğinizde verileriniz 30 gün içinde silinir.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">5. Haklarınız</h2>
          <p>KVKK kapsamında; verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama ve veri taşınabilirliği haklarına sahipsiniz. Talepleriniz için info@gulivechat.com adresine başvurabilirsiniz.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">6. İletişim</h2>
          <p>Gizlilik politikamız hakkında sorularınız için: info@gulivechat.com</p>
        </div>
      </div>
    </div>
  )
}
