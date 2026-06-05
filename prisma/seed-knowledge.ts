import { PrismaClient, ArticleStatus } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

const ARTICLES_BY_CATEGORY: Record<string, { name: string; description: string; icon: string; articles: { title: string; content: string; excerpt: string }[] }> = {
  'baslarken': {
    name: 'Başlarken',
    description: 'Gu Live Chat\'e hızlı başlangıç rehberi',
    icon: '🚀',
    articles: [
      {
        title: 'Gu Live Chat\'e Hoş Geldiniz',
        content: `# Gu Live Chat'e Hoş Geldiniz

Gu Live Chat, web sitenize kolayca entegre edebileceğiniz profesyonel bir canlı destek sistemidir.

## Hızlı Başlangıç

1. **Hesap Oluşturun** - Ücretsiz kayıt olun
2. **Site Ekleyin** - Panelden sitenizi ekleyin
3. **Widget'ı Özelleştirin** - Renk, logo ve mesajları ayarlayın
4. **Kodu Yerleştirin** - Size verilen kodu sitenize ekleyin
5. **Destek Vermeye Başlayın** - Müşterilerinizle anında iletişime geçin

## Özellikler

- Gerçek zamanlı sohbet
- Ziyaretçi takibi
- AI destekli chatbot
- Ekran paylaşımı
- Çoklu kanal desteği
- Detaylı analitik`,
        excerpt: 'Gu Live Chat\'e hızlı bir giriş ve temel özelliklere genel bakış.'
      },
      {
        title: 'Widget Kurulumu',
        content: `# Widget Kurulumu

Widget'ı sitenize eklemek için aşağıdaki adımları izleyin.

## 1. Kodu Alın

Ayarlar > Widget sayfasından size özel kodu kopyalayın.

## 2. Sitenize Ekleyin

Kodu sitenizin </body> etiketinden hemen önceye yapıştırın:

\`\`\`html
<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', 'SITE_ID');
</script>
<script src="https://sizin-domaininiz.com/widget.js" async></script>
\`\`\`

## 3. Test Edin

Sayfanızı yenileyin, sağ alt köşede chat butonu görmelisiniz.

## 4. Özelleştirin

Panelden widget rengini, pozisyonunu ve karşılama mesajını değiştirebilirsiniz.`,
        excerpt: 'Widget kodunu sitenize nasıl ekleyeceğinizi adım adım öğrenin.'
      },
    ]
  },
  'sorun-giderme': {
    name: 'Sorun Giderme',
    description: 'Sık karşılaşılan sorunlar ve çözümleri',
    icon: '🔧',
    articles: [
      {
        title: 'Widget Görünmüyor',
        content: `# Widget Görünmüyor

Widget'ın görünmemesinin birkaç sebebi olabilir:

## 1. Site ID Kontrolü

Kodda doğru WEBSITE_ID kullandığınızdan emin olun.

## 2. Tarayıcı Konsolu

F12 tuşuna basıp konsolu açın. Hata mesajı olup olmadığını kontrol edin.

## 3. Güvenlik Duvarı

Sitenizin güvenlik duvarı widget.js dosyasını engelliyor olabilir.

## 4. CSS Çakışması

Sitenizdeki CSS kuralları widget'ın görünmesini engelliyor olabilir.`,
        excerpt: 'Widget görünmüyorsa uygulayabileceğiniz çözümler.'
      },
    ]
  },
  'sss': {
    name: 'Sık Sorulan Sorular',
    description: 'En çok merak edilenler',
    icon: '❓',
    articles: [
      {
        title: 'Ücretlendirme Nasıl Çalışıyor?',
        content: `# Ücretlendirme

## Ücretsiz Plan
- 2 temsilci
- Ayda 100 sohbet
- Temel widget

## Başlangıç Planı - ₺199/ay
- 5 temsilci
- 1.000 sohbet/ay
- Chatbot & otomasyon

## Profesyonel Plan - ₺499/ay
- 15 temsilci
- Sınırsız sohbet
- Tüm özellikler

## Kurumsal Plan - ₺999/ay
- Sınırsız her şey
- Özel marka
- SLA garantisi`,
        excerpt: 'Tüm planlarımız ve fiyatlandırma detayları.'
      },
      {
        title: 'Verilerim Güvende mi?',
        content: `# Veri Güvenliği

## Şifreleme
Tüm veriler SSL/TLS ile şifrelenir.

## KVKK Uyumu
Türkiye'deki veri koruma yasalarına tam uyumluyuz.

## Veri Saklama
Verileriniz Avrupa'daki güvenli sunucularda saklanır.

## Yedekleme
Otomatik günlük yedekleme ile veri kaybına karşı koruma.`,
        excerpt: 'Veri güvenliği ve gizlilik politikamız hakkında bilgi.'
      },
    ]
  },
  'entegrasyon': {
    name: 'Entegrasyonlar',
    description: 'Üçüncü parti entegrasyonlar',
    icon: '🔗',
    articles: [
      {
        title: 'WhatsApp Entegrasyonu',
        content: `# WhatsApp Entegrasyonu

WhatsApp kanalını etkinleştirerek müşterilerinizle WhatsApp üzerinden iletişim kurabilirsiniz.

## Gereksinimler
- WhatsApp Business API hesabı
- Eklenti Mağazası'ndan WhatsApp Kanalı eklentisi

## Kurulum
1. Eklentiyi satın alın
2. WhatsApp Business API bilgilerinizi girin
3. Webhook URL'ini kaydedin
4. Kanalı etkinleştirin`,
        excerpt: 'WhatsApp Business API entegrasyonu ile müşteri desteğinizi genişletin.'
      },
    ]
  },
}

async function main() {
  console.log('📚 Bilgi Bankası seedleniyor...\n')

  const websites = await prisma.website.findMany({ select: { id: true, name: true } })

  if (websites.length === 0) {
    console.log('⚠️  Hiç website bulunamadı. Önce bir website oluşturun.')
    return
  }

  for (const website of websites) {
    console.log(`\n🌐 ${website.name}`)

    for (const [slug, catData] of Object.entries(ARTICLES_BY_CATEGORY)) {
      const existingCat = await prisma.knowledgeCategory.findFirst({
        where: { websiteId: website.id, slug },
      })

      let categoryId: string
      if (!existingCat) {
        const cat = await prisma.knowledgeCategory.create({
          data: {
            websiteId: website.id,
            name: catData.name,
            slug,
            description: catData.description,
            icon: catData.icon,
            order: Object.keys(ARTICLES_BY_CATEGORY).indexOf(slug),
          },
        })
        categoryId = cat.id
        console.log(`  📁 Kategori oluşturuldu: ${catData.name}`)
      } else {
        categoryId = existingCat.id
        console.log(`  📁 Kategori mevcut: ${catData.name}`)
      }

      for (const articleData of catData.articles) {
        const articleSlug = articleData.title
          .toLowerCase()
          .replace(/[ğüşıöç]/g, c => ({ 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c' })[c] || c)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        const existing = await prisma.knowledgeArticle.findFirst({
          where: { websiteId: website.id, slug: articleSlug },
        })

        if (!existing) {
          await prisma.knowledgeArticle.create({
            data: {
              websiteId: website.id,
              categoryId,
              title: articleData.title,
              slug: articleSlug,
              content: articleData.content,
              excerpt: articleData.excerpt,
              status: ArticleStatus.PUBLISHED,
              isFeatured: true,
              publishedAt: new Date(),
              viewCount: Math.floor(Math.random() * 500),
            },
          })
          console.log(`    ✅ ${articleData.title}`)
        } else {
          console.log(`    🔄 ${articleData.title} (güncellendi)`)
        }
      }
    }
  }

  console.log('\n✨ Bilgi Bankası başarıyla seedlendi!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
