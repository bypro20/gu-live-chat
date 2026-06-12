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

sed -i 's/Gu Live Chat/Gu Live Chat Yönetim/g' "$ROOT/android/app/src/main/res/values/strings.xml" 2>/dev/null || \
  sed -i '' 's/Gu Live Chat/Gu Live Chat Yönetim/g' "$ROOT/android/app/src/main/res/values/strings.xml"

# Yönetici paketi + User-Agent
OLD_MAIN="$ROOT/android/app/src/main/java/org/guchat/app/MainActivity.java"
NEW_DIR="$ROOT/android/app/src/main/java/org/guchat/admin"
mkdir -p "$NEW_DIR"
if [ -f "$OLD_MAIN" ]; then
  sed 's/package org\.guchat\.app;/package org.guchat.admin;/' "$OLD_MAIN" > "$NEW_DIR/MainActivity.java"
  rm -f "$OLD_MAIN"
fi
if [ -f "$NEW_DIR/MainActivity.java" ]; then
  if ! grep -q "GuChatAdminApp" "$NEW_DIR/MainActivity.java"; then
    sed -i 's/GuChatApp\/1.0/GuChatAdminApp\/1.0/g' "$NEW_DIR/MainActivity.java" 2>/dev/null || \
      sed -i '' 's/GuChatApp\/1.0/GuChatAdminApp\/1.0/g' "$NEW_DIR/MainActivity.java"
  fi
fi

echo "mobile-admin/android hazır. npm run sync && npm run build:apk:debug"
