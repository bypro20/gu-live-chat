<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Production deploy

Otomatik akış (tercih edilen):

1. Değişiklikleri bitir → `npm run deploy:auto -- "commit mesajı"`  
   (commit + push master + Vercel production + health/schema sync)
2. `master` push edilince GitHub Actions `.github/workflows/deploy-production.yml` build + post-deploy çalıştırır.

Manuel alternatifler:

- `git push origin master` — Vercel Git entegrasyonu deploy tetikler
- `npm run deploy:prod` — Vercel API ile GitHub master'dan deploy (yerel dosya yüklemez)
- `npm run post-deploy` — canlı health + schema sync

**Yapma:** `npx vercel --prod` (untracked dosyalar build'i bozabilir).

GitHub repo secrets (Actions için): `VERCEL_TOKEN`, isteğe bağlı `CRON_SECRET`.
