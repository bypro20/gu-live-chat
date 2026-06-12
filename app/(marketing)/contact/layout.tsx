import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('contact')

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
