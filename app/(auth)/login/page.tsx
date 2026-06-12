import GirisFormu from './login-form'

const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export default function GirisSayfasi() {
  return <GirisFormu googleAktif={googleAktif} />
}
