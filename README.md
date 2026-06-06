# Gu Live Chat

Crisp benzeri Türkçe canlı destek platformu (Next.js 16 + Socket.io + Prisma).

## Yerel Geliştirme

```bash
npm install
npm run db:push
npm run dev          # Next.js + Socket.io (server.ts)
```

- Dashboard: http://localhost:3000/dashboard
- Widget test: `public/demo.html` veya `public/test-site.html`

## Production: Vercel + Ayrı Socket Sunucusu

**Vercel serverless `server.ts` / Socket.io çalıştıramaz.** Canlı sohbet, ziyaretçi izleme ve ekran paylaşımı için Socket.io ayrı deploy edilmelidir.

### 1. Next.js → Vercel

```bash
npm run build
```

Vercel ortam değişkenleri (`.env.example`):

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Turso/Postgres |
| `AUTH_SECRET` | NextAuth |
| `NEXT_PUBLIC_APP_URL` | `https://guchat.org` |
| `NEXT_PUBLIC_SOCKET_URL` | Ayrı socket sunucusu URL'si |
| `NEXT_PUBLIC_MARKETING_WEBSITE_ID` | guchat.org widget WEBSITE_ID |

### 2. Socket.io → Railway / Fly.io / VPS

```bash
npm run start:socket   # socket-server.ts, port 3001
```

Aynı `DATABASE_URL` kullanın. CORS için `NEXT_PUBLIC_APP_URL=https://guchat.org` ayarlayın.

Vercel'de `NEXT_PUBLIC_SOCKET_URL=https://socket.guchat.org` (örnek) tanımlayın.

### Socket yokken

Mesajlar REST API ile kaydedilir; gelen kutusu 4 sn polling ile güncellenir (socket bağlıyken 30 sn).

## Widget Embed

```html
<script>
  window.GU_WIDGET_URL = 'https://guchat.org'; // opsiyonel, same-origin ise gerekmez
  window.$gu = window.$gu || function() { (window.$gu.q = window.$gu.q || []).push(arguments); };
  $gu('set', 'WEBSITE_ID', 'YOUR_WEBSITE_ID');
</script>
<script async src="https://guchat.org/widget.js"></script>
```
