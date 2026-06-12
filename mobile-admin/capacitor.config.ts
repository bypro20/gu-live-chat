import type { CapacitorConfig } from '@capacitor/cli'

/** Gu Live Chat Yönetim — sadece platform admin (ayrı APK) */
const config: CapacitorConfig = {
  appId: 'org.guchat.admin',
  appName: 'Gu Live Chat Yönetim',
  webDir: 'www',
  server: {
    url: 'https://gulivechat.com/admin-login?app=admin',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#080C14',
    appendUserAgent: 'GuLiveChatAdminApp/1.0',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#080C14',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#080C14',
    },
  },
}

export default config
