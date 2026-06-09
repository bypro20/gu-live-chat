# ProMedia — Sosyal Medya Bayilik Platformu

Yasal sosyal medya hizmeti satışı + bayilik sistemi.

## Özellikler

- **Tanıtım sitesi** — ana sayfa, paketler, bayilik, iletişim
- **3 hazır paket** — Başlangıç, Büyüme, Ajans Pro
- **Sipariş formu** — müşteri başvurusu
- **Bayi kayıt** — otomatik referans kodu
- **Bayi paneli** — referans linki, komisyon, siparişler
- **Admin paneli** — sipariş, bayi, lead yönetimi

## Kurulum

```bash
cd social-grow
npm install
cp .env.example .env
# .env içine MORESMM_API_KEY, JAP_API_KEY, IYZICO_*, JWT_SECRET ekle
npx prisma db push
npm run db:seed
npm run dev
```

## SMM API (MoreSMM + JustAnotherPanel)

`.env` dosyasına ekle:

```
MORESMM_API_URL=https://moresmm.com/api/v2
MORESMM_API_KEY=...
JAP_API_URL=https://justanotherpanel.com/api/v2
JAP_API_KEY=...
```

Admin panel → **SMM API** → panel seç, bakiye ve servisler  
Siparişler → panel seç + servis ID + link + adet → API ile gönder

Tarayıcı: http://localhost:3000

## Giriş bilgileri (seed sonrası)

- **Admin:** admin@prmdia.com — şifre: `SEED_ADMIN_PASSWORD` veya varsayılan `admin123` (yalnızca geliştirme)

## Güvenlik ve performans

- Panel ve admin API'leri middleware ile korunur
- Sipariş sorgulama: yalnızca `PM-...` kodu (+ isteğe bağlı e-posta doğrulama)
- Rate limit: leads, kayıt, telafi, sipariş sorgu
- Bayi kaydı admin onayı gerektirir (`isActive: false`)
- Ana sayfa ve paketler 5 dk cache (`revalidate`)
- Güvenlik header'ları (X-Frame-Options, nosniff, vb.)

## Otomatik SMM (opsiyonel)

Paketlere `smmServiceId` ve `smmProvider` tanımlayın, `.env` içinde:

```
AUTO_SMM_FULFILL=true
```

Ödeme sonrası sipariş otomatik SMM paneline gönderilir.

SMM durum senkronu (cron):

```
GET /api/cron/smm-sync
Authorization: Bearer CRON_SECRET
```

## Bayi nasıl para kazanır?

1. `/bayilik` sayfasından başvuru yapar
2. Panelden referans linkini alır: `site.com/paketler?ref=KODU`
3. Müşteri bu linkle sipariş verir
4. Komisyon otomatik hesaplanır (varsayılan %20)

## Para kazanma modeli

| Kim | Ne satar | Ne kazanır |
|-----|----------|------------|
| **Sen (platform)** | Bayilik + paket altyapısı | Aylık paket geliri |
| **Bayi** | Müşteriye sosyal medya hizmeti | Komisyon (%20-40) |
| **Müşteri** | Organik büyüme hizmeti | Gerçek takipçi/etkileşim |

## iyzico Ödeme

`.env` dosyasına iyzico anahtarlarını ekleyin:

```
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_SANDBOX=true
NEXT_PUBLIC_APP_URL=https://prmdia.com
```

Müşteri akışı: Paket seç → Bilgileri gir → iyzico 3D Secure ödeme → Sipariş aktif.

## Tüm servis & API rehberi

Eksik API anahtarları için: **[docs/SERVISLER.md](./docs/SERVISLER.md)**  
Canlı durum paneli: **/panel/servisler** (admin girişi gerekir)

## Sonraki adımlar

- [x] Telafi talebi API + admin paneli — `/telafi-talebi`, `/panel/telafi`
- [x] Bayi onay/komisyon yönetimi — `/panel/bayiler`
- [x] SMM durum cron — `/api/cron/smm-sync`
- [x] WhatsApp + Telegram + e-posta bildirimleri — `lib/notify.ts`
- [x] Servis kurulum paneli — `/panel/servisler`
- [x] Paket SMM eşleme — `/panel/paketler`
- [x] API rehberi — `docs/SERVISLER.md`
- [ ] Müşteri rapor paneli (Instagram Graph API — ayrı başvuru)
- [ ] Özel domain white-label

## iyzico Başvuru Kriterleri

- [x] Hakkımızda — `/hakkimizda`
- [x] Teslimat ve İade — `/teslimat-iade`
- [x] Gizlilik Sözleşmesi — `/gizlilik`
- [x] Mesafeli Satış — `/mesafeli-satis`
- [x] Ödeme Güvenliği — `/odeme-guvenligi`
- [x] Satın alınabilir paketler — `/paketler`, `/paketler/[slug]`
- [x] iyzico checkout entegrasyonu — `/api/iyzico/checkout`
- [x] iyzico + Visa + MasterCard logoları — footer ve ödeme formu
- [x] Sipariş sorgulama — `/siparis-sorgula`
- [ ] SSL — canlı yayında HTTPS gerekir (Vercel/Railway otomatik sağlar)

`src/lib/site.ts` içinde şirket adı, telefon ve e-postayı güncelle.

## Önemli

Bu platform **sahte takipçi satmaz**. Organik büyüme hizmeti satışı içindir.
