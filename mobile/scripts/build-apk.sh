#!/usr/bin/env bash
# Gu Live Chat Android APK derleme (sudo gerekmez)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/../tools/android-build"
export JAVA_HOME="${JAVA_HOME:-$TOOLS/jdk-21}"
export ANDROID_HOME="${ANDROID_HOME:-$TOOLS/android-sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "→ Capacitor sync..."
cd "$ROOT"
npm install --silent
npx cap sync android

echo "→ Gradle assembleDebug..."
cd android
chmod +x gradlew
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
DEST="$ROOT/../public/downloads/gulivechat.apk"
mkdir -p "$(dirname "$DEST")"
cp "$APK" "$DEST"
echo "✓ APK hazır: $DEST ($(du -h "$DEST" | cut -f1))"
