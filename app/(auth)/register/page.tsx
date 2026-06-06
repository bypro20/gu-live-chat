import KayitFormu from './register-form'

// Google OAuth yalnızca anahtarlar tanımlıysa aktif olur.
const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export default function KayitSayfasi() {
  return <KayitFormu googleAktif={googleAktif} />
}
