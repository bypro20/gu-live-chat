# Vercel ortam değişkenleri kontrol listesi

Yerel `.env` dosyanızdaki **gizli değerleri** (secret, client secret, token vb.) Vercel → Project → **Settings → Environment Variables → Production** bölümüne kopyalayın.  
**URL alanlarında** `gu-live-chat.vercel.app` kullanmayın; production için **`https://gulivechat.com`** kullanın.

## URL alanları (mutlaka gulivechat.com)

| Vercel değişkeni | Production değeri | Not |
|------------------|-------------------|-----|
| `NEXTAUTH_URL` | `https://gulivechat.com` | Trailing slash yok |
| `AUTH_URL` | `https://gulivechat.com` | NextAuth callback tabanı |
| `NEXT_PUBLIC_APP_URL` | `https://gulivechat.com` | Widget / linkler |
| `NEXT_PUBLIC_SOCKET_URL` | Railway URL (örn. `https://socket.gulivechat.com`) | Socket aynı domainde değilse **gulivechat.com yapmayın**; yerel `.env` ile aynı Railway adresini kullanın |
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
| `NEXTAUTH_URL` | ✅ | → `https://gulivechat.com` |
| `AUTH_URL` | ✅ | → `https://gulivechat.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ | → `https://gulivechat.com` |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Railway/socket subdomain; vercel.app değil |
| `NEXT_PUBLIC_MARKETING_WEBSITE_ID` veya `NEXT_PUBLIC_WIDGET_WEBSITE_ID` | Önerilen | gulivechat.com widget → inbox eşleşmesi |
| `BLOB_READ_WRITE_TOKEN` | Önerilen (Vercel → Storage → Blob) | S3 yokken dosya yükleme |
| `AWS_*` / `S3_*` | Opsiyonel | Blob yoksa S3 |
| `CONTACT_EMAIL` / `SUPPORT_EMAIL` | Önerilen | İletişim formu (yoksa admin bildirimi) |
| `SLACK_SIGNING_SECRET` | Opsiyonel | Slack webhook imza doğrulama |
| `NEXT_PUBLIC_PAYTR_ENABLED` | `true` sadece PayTR doluysa | Billing UI |
| `PAYTR_*` | Opsiyonel | — |
| `SMTP_*` | Opsiyonel | — |
| `OPENAI_API_KEY` | Opsiyonel | GPT-4o / GPT-4.1 |
| `ANTHROPIC_API_KEY` | Opsiyonel | Claude Haiku / Sonnet / Opus |
| `GEMINI_API_KEY` | **Önerilen** | Gemini Flash / Pro (ücretsiz başlangıç) |
| `GROQ_API_KEY` | Opsiyonel | Llama açık kaynak (ücretsiz katman) |
| `OPENROUTER_API_KEY` | Opsiyonel | Gemma/Llama/Qwen ücretsiz modeller |
| `OLLAMA_BASE_URL` | Opsiyonel | Kendi sunucunuz |
| `CRON_SECRET` | Varsa ✅ | — |
| `ADMIN_EMAIL` | ✅ | Örn. `admin@gulivechat.com` — platform yöneticisi |
| `ADMIN_PASSWORD` | ✅ | Güçlü rastgele şifre; git'e yazmayın |

## AI durumu kontrolü

Deploy sonrası:

```bash
curl https://gulivechat.com/api/ai/status
```

Cron ile canlı test (CRON_SECRET gerekir):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://gulivechat.com/api/cron/ai-smoke-test
curl -H "Authorization: Bearer $CRON_SECRET" https://gulivechat.com/api/cron/seed-ai-configs
```

Yerel `.env` / `.env.local` anahtarlarını Vercel'e göndermek için:

```bash
node scripts/push-ai-env.mjs && npx vercel --prod
```

## Admin hesabı (production)

1. Vercel'de `ADMIN_EMAIL`, `ADMIN_PASSWORD` ve `CRON_SECRET` tanımlayın.
2. Deploy sonrası bir kez çalıştırın:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://gulivechat.com/api/cron/seed-admin
```

Yerel: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed-admin`

## Google Cloud Console (OAuth)

| Alan | Değer |
|------|-------|
| Authorized JavaScript origins | `https://gulivechat.com` |
| Authorized redirect URIs | `https://gulivechat.com/api/auth/callback/google` |

## Deploy

Değişkenleri kaydettikten sonra: **Deployments → Redeploy** (mümkünse **Clear build cache**).

Detaylı anlatım: [README.md](./README.md) → *Production: Vercel + Ayrı Socket Sunucusu*.
