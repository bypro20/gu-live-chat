import { prisma } from './db'
import { resolveOrBootstrapMarketingWebsiteId } from './marketing-website'

/** İletişim formu — e-posta yoksa admin bildirimine düşer. */
export async function notifyAdminsOfContact(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const marketingWebsiteId = await resolveOrBootstrapMarketingWebsiteId()
  if (!marketingWebsiteId) return

  const website = await prisma.website.findUnique({
    where: { websiteId: marketingWebsiteId },
    select: { id: true, name: true },
  })
  if (!website) return

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  const title = `İletişim: ${data.subject}`
  const body = `${data.name} <${data.email}>\n\n${data.message}`
  const payload = JSON.stringify({ ...data, source: 'contact-form' })

  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          websiteId: website.id,
          type: 'NEW_MESSAGE',
          title,
          message: body.slice(0, 2000),
          data: payload,
        },
      })
    )
  )
}
