import { MYQR_PUBLIC_WEBSITE_ID } from '../lib/myqr-site'
import { prisma } from '../lib/db'

async function main() {
  const r = await prisma.website.updateMany({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    data: {
      showPreChatForm: true,
      requireName: true,
      requireEmail: true,
    },
  })
  console.log('updated', r.count)
  const w = await prisma.website.findUnique({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    select: {
      name: true,
      showPreChatForm: true,
      requireName: true,
      requireEmail: true,
    },
  })
  console.log(JSON.stringify(w))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
