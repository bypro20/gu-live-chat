/**
 * iyzico resmi logo paketi — footer: logo_band (Visa + MasterCard + iyzico ile Öde)
 * checkout: yatay iyzico ile Öde
 */
export function PaymentLogos({ variant = 'footer' }: { variant?: 'footer' | 'checkout' }) {
  const src =
    variant === 'footer' ? '/payments/iyzico-footer.svg' : '/payments/iyzico-ile-ode.svg'

  return (
    <div className="flex flex-col items-center gap-3" data-iyzico-payment-badge={variant}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="iyzico ile Öde — Visa ve MasterCard"
        width={429}
        height={32}
        className={
          variant === 'footer'
            ? 'h-8 w-auto max-w-[min(100%,429px)]'
            : 'h-10 w-auto max-w-[min(100%,280px)]'
        }
        loading="lazy"
      />
      <p className="text-center text-xs text-muted-foreground max-w-md">
        {variant === 'footer' ? (
          <>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <span aria-hidden>🔒</span> 256-bit SSL
            </span>
            {' · '}
            Ödemeler iyzico güvenli ödeme altyapısı üzerinden işlenir. Kredi kartı bilgileriniz
            tarafımızca saklanmaz.
          </>
        ) : (
          'Güvenli ödeme — iyzico altyapısı'
        )}
      </p>
    </div>
  )
}
