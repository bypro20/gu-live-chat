# Gu Live Chat

Crisp benzeri Türkçe canlı destek platformu (Next.js 16 + Socket.io + Prisma).

## Yerel Geliştirme

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev          # Next.js + Socket.io (server.ts, port 3000)
```

Alternatifler:

```bash
npm run dev:next     # Sadece Next.js (socket yok, polling fallback)
npm run dev:socket   # Sadece socket-server.ts (port 3001)
npm run dev:full     # next dev + server.ts paralel
```

- Dashboard: http://localhost:3000/dashboard
- Gelen kutusu: http://localhost:3000/inbox
- Widget test: `public/demo.html` veya marketing sayfası

## Production: Vercel + Ayrı Socket Sunucusu

**Vercel serverless `server.ts` / Socket.io çalıştıramaz.** Canlı sohbet, ziyaretçi izleme ve ekran paylaşımı için Socket.io ayrı deploy edilmelidir.

### 1. Next.js → Vercel

1. GitHub `master` branch'ini Vercel'e bağlayın (Production Branch: **master**)
2. Build Command: `npm run build` · Output: Next.js default · Install: `npm install`
3. Ortam değişkenlerini ayarlayın (aşağıdaki tablo)
4. Site güncellenmiyorsa: Vercel Dashboard → **Deployments** → son commit'i kontrol edin → **Redeploy** (Clear cache ile)

> Canlı site eski tasarımı gösteriyorsa genelde Vercel son GitHub commit'ini deploy etmemiştir. GitHub `master` SHA'sı ile Vercel Production deployment SHA'sını karşılaştırın.

### 2. Socket.io → Railway / Fly.io / VPS

```bash
# Railway'de start komutu:
npm run start:socket
```

| Railway env | Açıklama |
|-------------|----------|
| `DATABASE_URL` | Vercel ile aynı (Turso/Postgres) |
| `TURSO_AUTH_TOKEN` | Turso kullanıyorsanız |
| `NEXT_PUBLIC_APP_URL` | `https://guchat.org` (CORS) |
| `PORT` | Railway otomatik atar |

Health check: `GET /health` → `{"status":"ok"}`

### 3. Vercel ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DATABASE_URL` | ✅ | Turso `libsql://...` veya Postgres |
| `TURSO_AUTH_TOKEN` | Turso ise ✅ | Turso auth token |
| `AUTH_SECRET` | ✅ | NextAuth secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://guchat.org` |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Railway socket URL, örn. `https://socket.guchat.org` |
| `NEXT_PUBLIC_MARKETING_WEBSITE_ID` | Önerilen | guchat.org widget WEBSITE_ID |
| `AWS_*` | Opsiyonel | S3 dosya yükleme (yoksa `/public/uploads`) |
| `GOOGLE_CLIENT_*` | Opsiyonel | Google OAuth |
| `PAYTR_*` | Opsiyonel | Ödeme entegrasyonu |
| `SMTP_*` | Opsiyonel | E-posta bildirimleri |
| `OPENAI_API_KEY` | Opsiyonel | AI önerileri |

### Socket yokken (fallback)

Mesajlar REST API ile kaydedilir; gelen kutusu socket bağlı değilken 4 sn polling ile güncellenir (bağlıyken 30 sn).

## Widget Embed

```html
<script>
  window.GU_WIDGET_URL = 'https://guchat.org';
  window.$gu = window.$gu || function() { (window.$gu.q = window.$gu.q || []).push(arguments); };
  $gu('set', 'WEBSITE_ID', 'YOUR_WEBSITE_ID');
</script>
<script async src="https://guchat.org/widget.js"></script>
```

## Özellikler

- **Gerçek zamanlı sohbet** — Socket.io + REST fallback
- **Gelen kutusu** — Canlı mesaj, yazıyor göstergesi, konuşma listesi
- **Ziyaretçi izleme** — Sayfa görüntüleme, cursor, ekran görüntüsü, WebRTC
- **Webhook dispatcher** — HMAC imzalı HTTP POST (`lib/webhook-dispatcher.ts`)
- **Chatbot runtime** — Yeni konuşmada adım çalıştırma (`lib/chatbot-runner.ts`)
- **Workflow engine** — Tetikleyici bazlı otomasyon (`lib/workflow-runner.ts`)
- **Ban sistemi** — Kullanıcı + IP ban (`/api/admin/ip-bans`)
- **Bildirimler** — Mesaj/konuşma olaylarında DB bildirimi
- **Admin panel** — `/admin` (ADMIN rolü gerekli)

## Manuel Test Kontrol Listesi

- [ ] Widget: marketing sayfasında chat butonu görünüyor
- [ ] Widget → mesaj gönder → inbox'ta anlık görünüyor (socket bağlı)
- [ ] Agent → mesaj gönder → widget'ta anlık görünüyor
- [ ] Ziyaretçiler sayfası: canlı ziyaretçi listesi
- [ ] Ekran izleme: screenshot akışı
- [ ] Webhook: test URL'ye POST geliyor (`X-Gu-Signature` header)
- [ ] Chatbot: yeni konuşmada bot mesajı
- [ ] Admin: kullanıcı ban/unban, IP ban
- [ ] Dosya yükleme: inbox'tan dosya ekleme
