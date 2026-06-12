import KayitFormu from './register-form'

const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export default function KayitSayfasi() {
  return <KayitFormu googleAktif={googleAktif} />
}
