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
    <div className={`min-h-screen bg-background text-foreground ${className}`}>
      <MarketingNav />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className={`${contentClassName} mx-auto`}>{children}</div>
      </main>
      <MarketingFooter />
    </div>
  )
}
