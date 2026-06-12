#!/usr/bin/env bash
# Vercel ortam değişkenlerini yerel .env'den CLI/API ile senkronlamak için şablon.
# Gizli değerleri otomatik göndermez; token yoksa yalnızca rehberlik eder.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Hata: $ENV_FILE bulunamadı."
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN tanımlı değil."
  echo "1) https://vercel.com/account/tokens adresinden token oluşturun"
  echo "2) export VERCEL_TOKEN='...'  (shell oturumunuza; repoya yazmayın)"
  echo "3) cd $ROOT && npx vercel link"
  echo "4) Değişkenleri tek tek: npx vercel env add VARIABLE_NAME production"
  echo "   veya Dashboard: Project → Settings → Environment Variables"
  exit 1
fi

export VERCEL_TOKEN

echo "Bağlı proje kontrolü (npx vercel link gerekli olabilir)..."
if [[ ! -d "$ROOT/.vercel" ]]; then
  echo "Önce: cd $ROOT && npx vercel link"
  exit 1
fi

# Production için URL düzeltmesi gereken anahtarlar (VERCEL_ENV_CHECKLIST.md)
PROD_URL_VARS=(NEXTAUTH_URL AUTH_URL NEXT_PUBLIC_APP_URL)

echo ""
echo "Aşağıdaki değişkenler .env'de tanımlı; Vercel Production'a MANUEL eklemeniz önerilir."
echo "Bu script otomatik push yapmaz — her satır için onay istenir."
echo ""

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^# ]] && continue
  [[ -z "${line// }" ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"
  key="${key// /}"
  [[ "$key" == VERCEL_* ]] && continue

  for u in "${PROD_URL_VARS[@]}"; do
    if [[ "$key" == "$u" ]]; then
      echo "⚠ $key → production'da https://gulivechat.com olmalı (.env localhost olabilir)"
    fi
  done
  if [[ "$key" == "NEXT_PUBLIC_SOCKET_URL" ]]; then
    echo "ℹ $key → Railway/socket URL (.env ile aynı; gulivechat.com yapmayın)"
  fi

  read -r -p "Vercel'e '$key' eklemek ister misiniz? [y/N] " ans
  if [[ "${ans,,}" == "y" ]]; then
    echo "(Değeri yapıştırın; Enter ile bitirin — vercel env add interaktif mod)"
    npx vercel env add "$key" production
  fi
done < "$ENV_FILE"

echo ""
read -r -p "Production deploy başlatılsın mı? [y/N] " deploy
if [[ "${deploy,,}" == "y" ]]; then
  cd "$ROOT" && npx vercel --prod
else
  echo "Bitti. Deploy: cd $ROOT && npx vercel --prod"
fi
