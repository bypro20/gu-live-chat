'use client'
import Link from 'next/link'
export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">&larr; Ana Sayfa</Link>
        <h1 className="text-3xl font-bold mb-8">KVKK Aydınlatma Metni</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Gu Live Chat olarak veri sorumlusu sıfatıyla sizi bilgilendirmek isteriz.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Veri Sorumlusu</h2>
          <p>Gu Live Chat, [Şirket Bilgileri] adresinde faaliyet göstermektedir. KVKK kapsamında veri sorumlusu sıfatına sahiptir.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Kişisel Verilerin İşlenme Amacı</h2>
          <p>Toplanan kişisel verileriniz; hizmet sunumu, müşteri memnuniyeti, iletişim, pazarlama, hukuki yükümlülükler ve iş sürekliliği amaçlarıyla işlenmektedir.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Verilerin Aktarılması</h2>
          <p>Kişisel verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz. Hizmet sağlayıcılarımızla sınırlı amaçlarla paylaşılabilir.</p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Haklarınız</h2>
          <p>KVKK madde 11 kapsamında; veri işlenip işlenmediğini öğrenme, bilgi talep etme, amaç ve uygun kullanımını öğrenme, yurt içi/yurt dışı aktarımını bilme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
          <p className="mt-6">Başvuru için: info@gulivechat.com</p>
        </div>
      </div>
    </div>
  )
}
