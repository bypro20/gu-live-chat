import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('pricing')

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
