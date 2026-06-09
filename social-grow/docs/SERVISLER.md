# ProMedia — Servis & API Kurulum Rehberi

Bu dosya, ProMedia sitesinde kullanılan **tüm dış servislerin** nereden alınacağını, nasıl bağlanacağını ve hangi `.env` değişkenlerinin gerekli olduğunu açıklar.

Admin panelde canlı durum: **`/panel/servisler`**

---

## 1. iyzico — Ödeme (ZORUNLU)

| Değişken | Açıklama |
|----------|----------|
| `IYZICO_API_KEY` | API anahtarı |
| `IYZICO_SECRET_KEY` | Gizli anahtar |
| `IYZICO_SANDBOX` | `true` = test, `false` = canlı |

**İlke:** Kart bilgisi sizde tutulmaz. Müşteri iyzico 3D Secure formunda öder; callback ile doğrulanır.

**Nasıl alınır:**
1. https://merchant.iyzico.com/auth/register — üye işyeri başvurusu
2. Onay sonrası **Ayarlar → API Anahtarları**
3. Sandbox test: `IYZICO_SANDBOX=true`
4. Callback URL: `https://SITENIZ.com/api/iyzico/callback`

**Dokümantasyon:** https://dev.iyzico.com

---

## 2. MoreSMM — Teslimat paneli (ZORUNLU — en az bir SMM)

| Değişken | Açıklama |
|----------|----------|
| `MORESMM_API_URL` | `https://moresmm.com/api/v2` |
| `MORESMM_API_KEY` | Panel API key |

**İlke:** Standart SMM API v2 — POST `application/x-www-form-urlencoded`

**API aksiyonları (projede kullanılan):**

```
action=balance     → Bakiye
action=services    → Servis listesi
action=add         → Sipariş (service, link, quantity)
action=status      → Sipariş durumu (order)
```

**Nasıl alınır:**
1. https://moresmm.com hesap + bakiye
2. Hesap → **API Key** kopyala
3. Admin panel → **SMM API** → servis ID'leri gör
4. **Panel → Paketler** → her pakete servis ID eşle

---

## 3. JustAnotherPanel (JAP) — Yedek panel (OPSİYONEL)

| Değişken | Açıklama |
|----------|----------|
| `JAP_API_URL` | `https://justanotherpanel.com/api/v2` |
| `JAP_API_KEY` | API key |

MoreSMM ile **aynı API formatı**. Fiyat karşılaştırma veya yedek panel için.

**Kayıt:** https://justanotherpanel.com

---

## 4. Otomatik SMM gönderimi

| Değişken | Değer |
|----------|-------|
| `AUTO_SMM_FULFILL` | `true` |

**İlke:** Ödeme onaylanınca paketteki `smmServiceId` ile SMM paneline otomatik sipariş açılır.

**Gereksinimler:**
- SMM API key tanımlı
- `/panel/paketler` → her pakete `smmProvider` + `smmServiceId`

---

## 5. SMM durum cron

| Değişken | Açıklama |
|----------|----------|
| `CRON_SECRET` | Rastgele güçlü secret |

**Endpoint:**
```http
GET /api/cron/smm-sync
Authorization: Bearer CRON_SECRET
```

**Vercel Cron örneği** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/smm-sync",
    "schedule": "*/30 * * * *"
  }]
}
```
(Vercel'de cron header için `CRON_SECRET` environment variable kullanın)

---

## 6. JWT — Panel güvenliği (ZORUNLU production)

```bash
openssl rand -base64 32
```

→ `JWT_SECRET=...`

---

## 7. Resend — E-posta bildirimleri (OPSİYONEL)

| Değişken | Açıklama |
|----------|----------|
| `RESEND_API_KEY` | resend.com API key |
| `EMAIL_FROM` | Gönderen adres |
| `ADMIN_EMAIL` | Admin bildirim adresi |

**Ne zaman mail gider:**
- Müşteriye: ödeme onayı
- Admin'e: yeni sipariş, lead, bayi başvurusu, telafi

**Kayıt:** https://resend.com/signup  
**API:** `POST https://api.resend.com/emails`

---

## 8. WhatsApp Cloud API — Bildirim (OPSİYONEL)

| Değişken | Açıklama |
|----------|----------|
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp iş numarası ID |
| `ADMIN_WHATSAPP_NUMBER` | Alıcı (905xxxxxxxxx, + yok) |

**İlke:** Graph API v21 — admin numarasına metin mesajı

**API örneği:**
```http
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "905xxxxxxxxx",
  "type": "text",
  "text": { "body": "Yeni sipariş PM-..." }
}
```

**Nasıl alınır:**
1. https://developers.facebook.com/apps/ → Uygulama oluştur
2. **WhatsApp** ürününü ekle
3. **API Setup** → Phone number ID + Access token
4. Test için kendi numaranızı alıcı olarak kaydedin

**Dokümantasyon:** https://developers.facebook.com/docs/whatsapp/cloud-api

---

## 9. Telegram Bot — Admin bildirim (OPSİYONEL)

| Değişken | Açıklama |
|----------|----------|
| `TELEGRAM_BOT_TOKEN` | @BotFather token |
| `TELEGRAM_ADMIN_CHAT_ID` | Sizin chat ID |

**Nasıl alınır:**
1. Telegram → @BotFather → `/newbot`
2. Token'ı kopyala
3. Bota `/start` yaz
4. Chat ID: `https://api.telegram.org/bot{TOKEN}/getUpdates`

---

## 10. Production veritabanı (ÖNERİLEN canlı için)

SQLite yerine **Turso** veya **Postgres**:

```env
DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

**Turso:** https://turso.tech

---

## Hızlı kontrol listesi

| Servis | Zorunlu | Durum kontrolü |
|--------|---------|----------------|
| iyzico | ✅ | `/panel/servisler` |
| MoreSMM veya JAP | ✅ | `/panel/smm` bakiye |
| JWT_SECRET | ✅ | Production deploy |
| Paket SMM eşleme | ✅ | `/panel/paketler` |
| Resend | ⭕ | Test siparişi sonrası mail |
| WhatsApp | ⭕ | Test siparişi sonrası mesaj |
| Telegram | ⭕ | Test siparişi sonrası mesaj |
| CRON_SECRET | ⭕ | SMM durum takibi |

---

## SMM API v2 — Teknik referans (MoreSMM / JAP)

Tüm paneller aynı formatta:

```bash
curl -X POST "https://moresmm.com/api/v2" \
  -d "key=API_KEY" \
  -d "action=balance"

curl -X POST "https://moresmm.com/api/v2" \
  -d "key=API_KEY" \
  -d "action=add" \
  -d "service=123" \
  -d "link=https://instagram.com/kullanici" \
  -d "quantity=1000"
```

**Yanıt (add):** `{ "order": 987654 }`

**Yanıt (status):** `{ "status": "Completed", "remains": "0" }`

---

## Vercel ortam değişkenleri — kopyala yapıştır şablonu

```env
JWT_SECRET=
NEXT_PUBLIC_APP_URL=https://promedia-kappa.vercel.app
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_SANDBOX=false
MORESMM_API_KEY=
JAP_API_KEY=
AUTO_SMM_FULFILL=true
CRON_SECRET=
RESEND_API_KEY=
EMAIL_FROM=ProMedia <noreply@prmdia.com>
ADMIN_EMAIL=destek@prmdia.com
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
ADMIN_WHATSAPP_NUMBER=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

Deploy sonrası: `npx prisma db push` + admin giriş → `/panel/servisler` kontrol.
