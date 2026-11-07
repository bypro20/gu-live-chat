import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export function MarketingPageShell({
  children,
  className = '',
  contentClassName = 'max-w-4xl',
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div className={`dark hv2-scope hv2-grain relative min-h-screen overflow-hidden text-foreground ${className}`}>
      <div className="hv2-aurora hv2-aurora-page" aria-hidden="true" />
      <MarketingNav tone="dark" />
      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className={`${contentClassName} mx-auto`}>{children}</div>
      </main>
      <MarketingFooter tone="dark" />
    </div>
  )
}
