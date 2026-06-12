import type { SiteLocale } from './regional-config'
import { TRIAL_DAYS } from './trial-config'
import { getPlanEntry } from './plan-i18n'

export type AuthMessages = {
  brandTagline: string
  brandSubtitle: string
  brandFooter: string
  features: string[]
  loginFeatures: string[]
  login: {
    title: string
    nativeTitle: string
    subtitle: string
    email: string
    password: string
    submit: string
    submitting: string
    google: string
    googleRetry: string
    googleRedirecting: string
    orEmail: string
    noAccount: string
    register: string
    backToSite: string
    wrongCredentials: string
    loginError: string
    oauth: Record<string, string>
  }
  register: {
    title: string
    inviteTitle: string
    subtitle: string
    inviteSubtitle: (site: string) => string
    planSubtitle: (plan: string) => string
    defaultSubtitle: string
    selectedPlan: (plan: string) => string
    google: string
    orEmail: string
    name: string
    namePlaceholder: string
    email: string
    password: string
    confirmPassword: string
    websiteSection: string
    websiteName: string
    websiteNamePlaceholder: string
    websiteDomain: string
    websiteDomainPlaceholder: string
    submit: string
    submitting: string
    hasAccount: string
    login: string
    passwordMismatch: string
    registerError: string
  }
  errors: {
    emailTaken: string
    invalidInput: string
    accessDenied: string
  }
}

const loginOauthTr: AuthMessages['login']['oauth'] = {
  OAuthSignin: 'Google girişi başlatılamadı. Lütfen tekrar deneyin.',
  OAuthCallback: 'Google giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.',
  OAuthCreateAccount: 'Hesap oluşturulamadı. Lütfen e-posta ile kayıt olun.',
  OAuthAccountNotLinked: 'Bu e-posta zaten kayıtlı. E-posta/şifre ile giriş yapın.',
  AccessDenied: 'Erişim reddedildi. Hesabınız askıya alınmış olabilir.',
  Configuration: 'Sunucu yapılandırma hatası. Lütfen birkaç saniye bekleyip tekrar deneyin.',
  Verification: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.',
  Default: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.',
}

const loginOauthEn: AuthMessages['login']['oauth'] = {
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  OAuthCallback: 'Google sign-in could not be completed. Please try again.',
  OAuthCreateAccount: 'Could not create account. Please register with email.',
  OAuthAccountNotLinked: 'This email is already registered. Sign in with email/password.',
  AccessDenied: 'Access denied. Your account may be suspended.',
  Configuration: 'Server configuration error. Please wait a moment and try again.',
  Verification: 'Verification link is invalid or expired.',
  Default: 'An error occurred during sign-in. Please try again.',
}

export function getAuthMessages(locale: SiteLocale): AuthMessages {
  if (locale === 'en') {
    return {
      brandTagline: 'Gu Live Chat',
      brandSubtitle: 'Reply to customers instantly with a professional live chat platform.',
      brandFooter: 'Built in Turkey · GDPR ready · 99.9% uptime',
      features: [
        'Start free, no credit card required',
        'GDPR-ready secure infrastructure',
        'Advanced analytics and reporting',
        'Add unlimited team members',
      ],
      loginFeatures: [
        'Setup in 30 seconds',
        'GDPR-ready secure infrastructure',
        'AI-powered smart chatbot',
        'Multi-channel support',
      ],
      login: {
        title: 'Welcome back',
        nativeTitle: 'Gu Live Chat',
        subtitle: 'Sign in to your account',
        email: 'Email',
        password: 'Password',
        submit: 'Sign In',
        submitting: 'Signing in...',
        google: 'Continue with Google',
        googleRetry: 'Try again — Continue with Google',
        googleRedirecting: 'Redirecting...',
        orEmail: 'or with email',
        noAccount: "Don't have an account?",
        register: 'Register',
        backToSite: 'Back to site',
        wrongCredentials: 'Incorrect email or password',
        loginError: 'An error occurred during sign-in',
        oauth: loginOauthEn,
      },
      register: {
        title: 'Create account',
        inviteTitle: 'Accept team invite',
        subtitle: 'Get started in 2 minutes — PRO trial starts on signup',
        inviteSubtitle: (site) => `Create an account to join the ${site} team`,
        planSubtitle: (plan) => `Register for the ${plan} plan — ${TRIAL_DAYS}-day free PRO trial`,
        defaultSubtitle: `Get started free in 2 minutes — ${TRIAL_DAYS}-day PRO trial on signup`,
        selectedPlan: (plan) => `Selected plan: ${plan}`,
        google: 'Sign up with Google',
        orEmail: 'or with email',
        name: 'Your name',
        namePlaceholder: 'Full name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        websiteSection: 'Website details',
        websiteName: 'Website name',
        websiteNamePlaceholder: 'Company name',
        websiteDomain: 'Website domain',
        websiteDomainPlaceholder: 'example.com',
        submit: 'Create account',
        submitting: 'Creating account...',
        hasAccount: 'Already have an account?',
        login: 'Sign In',
        passwordMismatch: 'Passwords do not match',
        registerError: 'An error occurred during registration',
      },
      errors: {
        emailTaken: 'This email is already in use',
        invalidInput: 'Invalid input data',
        accessDenied: 'Access denied',
      },
    }
  }

  return {
    brandTagline: 'Gu Live Chat',
    brandSubtitle: '2 dakikada profesyonel canlı destek sistemi kurun.',
    brandFooter: 'Türk yapımı · KVKK uyumlu · 99.9% uptime',
    features: [
      'Ücretsiz başlayın, kredi kartı gerekmez',
      'KVKK uyumlu, Avrupa veri merkezi',
      'Gelişmiş analitik ve raporlama',
      'Sınırsız ekip üyesi ekleme',
    ],
    loginFeatures: [
      '30 saniyede kurulum',
      'KVKK uyumlu güvenli altyapı',
      'AI destekli akıllı chatbot',
      'Çoklu kanal desteği',
    ],
    login: {
      title: 'Hoş Geldiniz',
      nativeTitle: 'Gu Live Chat',
      subtitle: 'Hesabınıza giriş yapın',
      email: 'E-posta',
      password: 'Şifre',
      submit: 'Giriş Yap',
      submitting: 'Giriş yapılıyor...',
      google: 'Google ile devam et',
      googleRetry: 'Tekrar Dene — Google ile Giriş',
      googleRedirecting: 'Yönlendiriliyor...',
      orEmail: 'veya e-posta ile',
      noAccount: 'Hesabınız yok mu?',
      register: 'Kayıt Ol',
      backToSite: 'Siteye Dön',
      wrongCredentials: 'E-posta veya şifre hatalı',
      loginError: 'Giriş sırasında bir hata oluştu',
      oauth: loginOauthTr,
    },
    register: {
      title: 'Hesap Oluştur',
      inviteTitle: 'Takım Davetini Kabul Et',
      subtitle: '2 dakikada ücretsiz başlayın — kayıtta PRO deneme başlar',
      inviteSubtitle: (site) => `${site} takımına katılmak için hesap oluşturun`,
      planSubtitle: (plan) => `${plan} planı için kayıt olun — ${TRIAL_DAYS} gün ücretsiz PRO deneyin`,
      defaultSubtitle: `2 dakikada ücretsiz başlayın — kayıtta ${TRIAL_DAYS} gün PRO deneme başlar`,
      selectedPlan: (plan) => `Seçilen plan: ${plan}`,
      google: 'Google ile kayıt ol',
      orEmail: 'veya e-posta ile',
      name: 'Adınız',
      namePlaceholder: 'Ad Soyad',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifre Tekrar',
      websiteSection: 'Website Bilgileri',
      websiteName: 'Website Adı',
      websiteNamePlaceholder: 'Şirket Adı',
      websiteDomain: 'Website Domain',
      websiteDomainPlaceholder: 'orneksite.com',
      submit: 'Hesap Oluştur',
      submitting: 'Hesap oluşturuluyor...',
      hasAccount: 'Zaten hesabınız var mı?',
      login: 'Giriş Yap',
      passwordMismatch: 'Şifreler eşleşmiyor',
      registerError: 'Kayıt sırasında bir hata oluştu',
    },
    errors: {
      emailTaken: 'Bu e-posta adresi zaten kullanılıyor',
      invalidInput: 'Geçersiz giriş verileri',
      accessDenied: 'Erişim engellendi',
    },
  }
}

/** Sunucudan gelen Türkçe hata mesajlarını locale'e çevir */
export function translateAuthApiError(message: string, locale: SiteLocale): string {
  if (locale === 'tr') return message
  const m = getAuthMessages('en').errors
  const map: Record<string, string> = {
    'Bu e-posta adresi zaten kullanılıyor': m.emailTaken,
    'Geçersiz giriş verileri': m.invalidInput,
    'Erişim engellendi': m.accessDenied,
    'Kayıt sırasında bir hata oluştu': getAuthMessages('en').register.registerError,
  }
  return map[message] || message
}

export function planLabelForAuth(locale: SiteLocale, planId: string): string | null {
  if (!['STARTER', 'PRO', 'BUSINESS', 'FREE'].includes(planId)) return null
  return getPlanEntry(locale, planId as 'STARTER').name
}
