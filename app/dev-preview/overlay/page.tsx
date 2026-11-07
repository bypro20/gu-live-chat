import { notFound } from 'next/navigation'
import { OverlayPreviewDemo } from './demo'

/** Yalnızca geliştirmede: izleme penceresini sahte veriyle önizler. Canlıda 404. */
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <OverlayPreviewDemo />
}
