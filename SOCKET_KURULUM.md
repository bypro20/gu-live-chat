# Socket.io Sunucusu — Railway Kurulumu

Vercel serverless Socket.io çalıştıramaz. Canlı mesajlaşma için `socket-server.ts` ayrı bir servis olarak deploy edilir.

## 1. Railway projesi oluştur

1. [railway.app](https://railway.app) → giriş yap
2. **New Project** → **Deploy from GitHub repo**
3. Repo: `bypro20/gu-live-chat`
4. Servis oluşunca **Settings**:
   - **Start Command:** `npm run start:socket` (veya `railway.toml` otomatik okur)
   - **Health Check Path:** `/health`

> `railway.toml` ve `nixpacks.toml` repoda hazır — Next.js build yapılmaz, sadece Prisma generate + socket başlar.

## 2. Railway ortam değişkenleri

Vercel'deki **aynı** değerleri kopyala:

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Turso/libSQL bağlantısı |
| `TURSO_AUTH_TOKEN` | Turso auth (varsa) |
| `NEXT_PUBLIC_APP_URL` | `https://guchat.org` |
| `SOCKET_INTERNAL_SECRET` | Vercel `CRON_SECRET` ile **aynı** |
| `SOCKET_CORS_ORIGINS` | (opsiyonel) `https://guchat.org,https://www.guchat.org` |

`PORT` Railway tarafından otomatik atanır — elle yazma.

## 3. Public URL al

Railway → servis → **Settings** → **Networking** → **Generate Domain**

Örnek: `https://gu-live-chat-production-xxxx.up.railway.app`

Test:

```bash
curl https://SENIN-URL.up.railway.app/health
# {"status":"ok","service":"gu-live-chat-socket","socketReady":true,...}
```

## 4. Vercel env güncelle

Railway URL'sini aldıktan sonra:

```bash
VERCEL_TOKEN=... \
CRON_SECRET=... \
SOCKET_URL=https://SENIN-URL.up.railway.app \
node scripts/set-socket-env.mjs
```

Bu script şunları yazar ve production redeploy tetikler:

- `NEXT_PUBLIC_SOCKET_URL`
- `SOCKET_SERVER_URL`
- `SOCKET_INTERNAL_SECRET`

## 5. (Opsiyonel) Özel domain

Railway Networking → **Custom Domain** → `socket.guchat.org`

DNS: CNAME `socket` → Railway'in verdiği hedef.

Sonra `SOCKET_URL=https://socket.guchat.org` ile script'i tekrar çalıştır.

## 6. Doğrulama

```bash
curl https://guchat.org/api/health
# "socket": true, "socketConfigured": true
```

Admin → **Gelen Kutusu** → "Canlı bağlantı" görünmeli; widget mesajı anında düşmeli.

## Yerel geliştirme

```bash
# Terminal 1
npm run dev:next

# Terminal 2
npm run dev:socket

# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_SERVER_URL=http://localhost:3001
SOCKET_INTERNAL_SECRET=dev-secret
```
