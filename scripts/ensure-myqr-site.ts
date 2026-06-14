import { ensureMyQrWebsite, MYQR_PUBLIC_WEBSITE_ID, findMyQrWebsite } from '../lib/myqr-site'
import { prisma } from '../lib/db'

async function main() {
  const before = await findMyQrWebsite()
  const site = await ensureMyQrWebsite()
  const after = await prisma.website.findUnique({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    select: {
      name: true,
      domain: true,
      websiteId: true,
      plan: true,
      subscriptionStatus: true,
      showPreChatForm: true,
      requireName: true,
      requireEmail: true,
      showConsentBanner: true,
      cookieConsentEnabled: true,
      owner: { select: { email: true } },
    },
  })

  console.log(before ? 'myQR sitesi güncellendi' : 'myQR sitesi oluşturuldu')
  console.log(JSON.stringify({ site, config: after }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
