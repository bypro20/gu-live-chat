# Gu Chat — Google Ads Kurulum Rehberi (En hızlı dönüşüm)

Gu Chat için **en düşük maliyet / en çok kayıt** kanalı: **Google Arama reklamları**.
İnsan zaten "canlı destek yazılımı" arıyor → satın alma niyeti yüksek.

## 1. Hesap aç (15 dk)

1. https://ads.google.com → Hesap oluştur
2. Fatura bilgilerini gir (kart)
3. İlk kampanyayı **Arama** (Search) seç — Display/YouTube DEĞİL

## 2. Kampanya ayarları

| Ayar | Değer |
|------|-------|
| Hedef | Potansiyel müşteriler / Dönüşümler |
| Ağ | Sadece **Google Arama** (Display kapalı) |
| Konum | Türkiye |
| Dil | Türkçe |
| Günlük bütçe | **₺80/gün** (~₺2.400/ay) başlangıç |
| Teklif | Maksimum tıklama (başlangıç) veya Hedef CPA (veri birikince) |

## 3. Landing URL (kopyala-yapıştır)

```
https://guchat.org/basla?utm_source=google&utm_medium=cpc&utm_campaign=search-canli-destek
```

Bu sayfa reklam için optimize edildi — tek CTA, dikkat dağıtmıyor.

## 4. Anahtar kelimeler (tam eşleme [ ] ile)

Yüksek dönüşüm — bunlarla başla:

```
[canlı destek yazılımı]
[live chat türkiye]
[canlı sohbet widget]
[chatbot yazılımı]
[whatsapp müşteri hizmetleri yazılımı]
[e ticaret canlı destek]
```

Geniş eşleme KULLANMA (pahalı, düşük dönüşüm).

## 5. Negatif anahtar kelimeler (para israfını önler)

```
-ücretsiz indir
-apk
-iş ilanı
-kurs
-nedir
-wikipedia
-oyun
```

## 6. Reklam metni örneği

**Başlık 1:** Canlı Destek Yazılımı  
**Başlık 2:** 7 Gün Ücretsiz PRO Deneme  
**Başlık 3:** Kurulum 30 Saniye  
**Açıklama:** Web sitenize anında canlı sohbet ekleyin. AI chatbot, WhatsApp inbox. Kredi kartı gerekmez. Hemen başlayın.

## 7. Dönüşüm takibi

Vercel env (Analytics kurulunca):

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_REGISTER_CONVERSION=AW-XXX/kayit-label
```

Kayıt = dönüşüm. Admin panel → Pazarlama → kaynak raporu.

## 8. Beklenti (Türkiye SaaS, başlangıç)

| Metrik | Tahmini |
|--------|---------|
| Tıklama başı | ₺3–12 |
| Kayıt oranı (landing) | %8–15 |
| Kayıt başı maliyet | ₺40–120 |
| İlk ay kayıt (₺80/gün) | 20–60 |

Meta/Instagram soğuk trafikte kayıt maliyeti genelde 2–3x daha pahalı.
LinkedIn B2B için iyi ama başlangıç bütçesi yüksek.

## 9. 2. hafta — retargeting (Meta)

Google'da kayıt olmayan ziyaretçilere Instagram reklamı (Pixel gerekli).
Önce Google 1–2 hafta çalışsın, sonra Meta retargeting ekle.

## 10. Kontrol listesi

- [ ] Google Ads hesabı açıldı
- [ ] Kampanya: sadece Arama
- [ ] URL: guchat.org/basla
- [ ] 6 anahtar kelime eklendi
- [ ] Negatif kelimeler eklendi
- [ ] GA4 ID Vercel'e eklendi
- [ ] Admin → Pazarlama'dan link kopyalandı
