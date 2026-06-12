import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.guchat.app',
  appName: 'Gu Live Chat',
  webDir: 'www',
  // Uzak URL yok — önce yerel kabuk, sonra gulivechat.com (tarayıcı adres çubuğu asla görünmez)
  server: {
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['gulivechat.com', '*.gulivechat.com', 'www.gulivechat.com'],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0B1220',
    appendUserAgent: 'GuLiveChatApp/1.0',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0B1220',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B1220',
    },
  },
}

export default config
