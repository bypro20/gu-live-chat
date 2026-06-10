# Gu Chat Yönetim (Admin APK)

Platform yönetim paneli için **ayrı** Android uygulaması. Müşteri APK'sından tamamen bağımsızdır.

- **Müşteri uygulaması:** `mobile/` → `guchat.org/login?app=android`
- **Yönetici uygulaması:** `mobile-admin/` → `guchat.org/admin-login?app=admin`

## Kurulum

```bash
cd mobile-admin
npm install
npm run setup:android   # mobile/android'den kopyalar ve admin olarak yapılandırır
npx cap sync android
npm run build:apk:debug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Web erişimi (tarayıcı)

Yönetici girişi her zaman: **https://guchat.org/admin-login**

Müşteri mobil uygulamasından admin paneline erişim engellenmiştir.
