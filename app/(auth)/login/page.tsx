import { Suspense } from 'react'
import GirisFormu from './login-form'

// Google OAuth yalnızca anahtarlar tanımlıysa aktif olur.
const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export default function GirisSayfasi() {
  return (
    <Suspense fallback={null}>
      <GirisFormu googleAktif={googleAktif} />
    </Suspense>
  )
}
