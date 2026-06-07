# Vercel ortam değişkenleri kontrol listesi

Yerel `.env` dosyanızdaki **gizli değerleri** (secret, client secret, token vb.) Vercel → Project → **Settings → Environment Variables → Production** bölümüne kopyalayın.  
**URL alanlarında** `gu-live-chat.vercel.app` kullanmayın; production için **`https://guchat.org`** kullanın.

## URL alanları (mutlaka guchat.org)

| Vercel değişkeni | Production değeri | Not |
|------------------|-------------------|-----|
| `NEXTAUTH_URL` | `https://guchat.org` | Trailing slash yok |
| `AUTH_URL` | `https://guchat.org` | NextAuth callback tabanı |
| `NEXT_PUBLIC_APP_URL` | `https://guchat.org` | Widget / linkler |
| `NEXT_PUBLIC_SOCKET_URL` | Railway URL (örn. `https://socket.guchat.org`) | Socket aynı domainde değilse **guchat.org yapmayın**; yerel `.env` ile aynı Railway adresini kullanın |
| `SOCKET_SERVER_URL` | Railway URL (aynı socket host) | Vercel API → socket köprüsü (mesajların widget'a gitmesi için) |
| `SOCKET_INTERNAL_SECRET` | Güçlü secret (veya `CRON_SECRET` ile aynı) | `/internal/emit` yetkilendirmesi |

## `.env` → Vercel (değerleri kopyala, URL’leri yukarıdaki gibi düzelt)

| Değişken | Vercel’e kopyala | URL düzeltmesi |
|----------|------------------|----------------|
| `DATABASE_URL` | ✅ | — |
| `TURSO_AUTH_TOKEN` | Turso kullanıyorsanız ✅ | — |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | ✅ (projede hangisi tanımlıysa) | — |
| `GOOGLE_CLIENT_ID` | ✅ | — |
| `GOOGLE_CLIENT_SECRET` | ✅ | — |
| `NEXTAUTH_URL` | ✅ | → `https://guchat.org` |
| `AUTH_URL` | ✅ | → `https://guchat.org` |
| `NEXT_PUBLIC_APP_URL` | ✅ | → `https://guchat.org` |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Railway/socket subdomain; vercel.app değil |
| `NEXT_PUBLIC_MARKETING_WEBSITE_ID` veya `NEXT_PUBLIC_WIDGET_WEBSITE_ID` | Önerilen | guchat.org widget → inbox eşleşmesi |
| `AWS_*` / `S3_*` | Opsiyonel | — |
| `PAYTR_*` | Opsiyonel | — |
| `SMTP_*` | Opsiyonel | — |
| `OPENAI_API_KEY` | Opsiyonel | — |
| `CRON_SECRET` | Varsa ✅ | — |
| `ADMIN_EMAIL` | ✅ | Örn. `admin@guchat.org` — platform yöneticisi |
| `ADMIN_PASSWORD` | ✅ | Güçlü rastgele şifre; git'e yazmayın |

## Admin hesabı (production)

1. Vercel'de `ADMIN_EMAIL`, `ADMIN_PASSWORD` ve `CRON_SECRET` tanımlayın.
2. Deploy sonrası bir kez çalıştırın:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://guchat.org/api/cron/seed-admin
```

Yerel: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed-admin`

## Google Cloud Console (OAuth)

| Alan | Değer |
|------|-------|
| Authorized JavaScript origins | `https://guchat.org` |
| Authorized redirect URIs | `https://guchat.org/api/auth/callback/google` |

## Deploy

Değişkenleri kaydettikten sonra: **Deployments → Redeploy** (mümkünse **Clear build cache**).

Detaylı anlatım: [README.md](./README.md) → *Production: Vercel + Ayrı Socket Sunucusu*.
