/** PRO deneme süresi — tek kaynak */
export const TRIAL_DAYS = 7
export const TRIAL_BONUS_WIDGET_DAYS = 3
export const TRIAL_BONUS_FIRST_CHAT_DAYS = 3
export const TRIAL_MAX_DAYS =
  TRIAL_DAYS + TRIAL_BONUS_WIDGET_DAYS + TRIAL_BONUS_FIRST_CHAT_DAYS

export const TRIAL_PLAN_LABEL = 'PRO'

export function trialHeroLine(): string {
  return `${TRIAL_DAYS} gün ücretsiz · Kredi kartı gerekmez · Kurulum 30 saniye`
}

export function trialShortLabel(): string {
  return `${TRIAL_DAYS} gün ücretsiz deneme`
}

export function trialRegisterLine(planLabel?: string): string {
  const plan = planLabel ? `${planLabel} planı için kayıt olun — ` : ''
  return `${plan}${TRIAL_DAYS} gün ücretsiz PRO deneyin`
}

export function trialBillingTitle(): string {
  return `${TRIAL_DAYS} Gün Ücretsiz PRO Deneyin`
}

export function trialBillingSubtitle(): string {
  return `Tüm PRO özelliklerini ${TRIAL_DAYS} gün boyunca ücretsiz kullanın. Widget kurunca +${TRIAL_BONUS_WIDGET_DAYS}, ilk sohbetle +${TRIAL_BONUS_FIRST_CHAT_DAYS} gün daha.`
}

export function trialPricingHeadline(): string {
  return `Her planı ${TRIAL_DAYS} gün boyunca ücretsiz deneyin`
}

export function trialPricingCta(): string {
  return `${TRIAL_DAYS} gün ücretsiz deneyin. Taahhüt yok, kredi kartı gerekmez.`
}

export function trialFaqQuestion(): string {
  return `${TRIAL_DAYS} günlük deneme nasıl çalışır?`
}

export function trialFaqAnswer(): string {
  return `Kayıt olduğunuzda PRO planın tüm özelliklerine ${TRIAL_DAYS} gün boyunca ücretsiz erişim sağlarsınız. Widget'ı sitenize kurunca +${TRIAL_BONUS_WIDGET_DAYS} gün, ilk gerçek sohbetinizde +${TRIAL_BONUS_FIRST_CHAT_DAYS} gün daha kazanırsınız (en fazla ${TRIAL_MAX_DAYS} gün). Süre sonunda ödeme yapmazsanız otomatik olarak Ücretsiz plana geçilir.`
}

export function trialFreeTierFaqLine(): string {
  return `Kredi kartı gerekmez, ${TRIAL_DAYS} gün PRO özelliklerini deneyebilirsiniz.`
}

export function trialSeoHome(): string {
  return `${TRIAL_DAYS} gün ücretsiz deneyin.`
}

export function trialSeoPricing(): string {
  return `${TRIAL_DAYS} gün ücretsiz deneme.`
}
