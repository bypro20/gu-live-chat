import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('urunler')

export default function UrunlerLayout({ children }: { children: React.ReactNode }) {
  return children
}
