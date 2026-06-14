import { MYQR_PUBLIC_WEBSITE_ID } from '../lib/myqr-site'
import { prisma } from '../lib/db'

async function main() {
  const r = await prisma.website.updateMany({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    data: { showConsentBanner: false, cookieConsentEnabled: false },
  })
  console.log('updated', r.count)
  const w = await prisma.website.findUnique({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    select: { name: true, showConsentBanner: true, cookieConsentEnabled: true },
  })
  console.log(JSON.stringify(w))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
