#!/usr/bin/env bash
# Müşteri mobile/android projesinden yönetici APK iskeleti oluşturur
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="../mobile"

if [ ! -d "$ROOT/$MOBILE/android" ]; then
  echo "Önce mobile/android oluşturulmalı (mobile klasöründe cap sync android)"
  exit 1
fi

rm -rf "$ROOT/android"
cp -a "$ROOT/$MOBILE/android" "$ROOT/android"

# Uygulama kimliği ve adı
sed -i 's/org\.guchat\.app/org.guchat.admin/g' "$ROOT/android/app/build.gradle" 2>/dev/null || \
  sed -i '' 's/org\.guchat\.app/org.guchat.admin/g' "$ROOT/android/app/build.gradle"

sed -i 's/Gu Chat/Gu Chat Yönetim/g' "$ROOT/android/app/src/main/res/values/strings.xml" 2>/dev/null || \
  sed -i '' 's/Gu Chat/Gu Chat Yönetim/g' "$ROOT/android/app/src/main/res/values/strings.xml"

# Yönetici User-Agent
MAIN="$ROOT/android/app/src/main/java/org/guchat/app/MainActivity.java"
if [ -f "$MAIN" ]; then
  sed -i 's/GuChatApp\/1.0/GuChatAdminApp\/1.0/g' "$MAIN" 2>/dev/null || \
    sed -i '' 's/GuChatApp\/1.0/GuChatAdminApp\/1.0/g' "$MAIN"
fi

echo "mobile-admin/android hazır. npm run sync && npm run build:apk:debug"
