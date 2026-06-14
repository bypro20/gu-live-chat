import { prisma } from "../lib/db";

async function main() {
  const r = await prisma.website.updateMany({
    data: {
      showPreChatForm: true,
      requireName: true,
      requireEmail: true,
    },
  });
  console.log("all websites updated:", r.count);

  const sample = await prisma.website.findMany({
    take: 5,
    select: {
      name: true,
      websiteId: true,
      showPreChatForm: true,
      requireName: true,
      requireEmail: true,
    },
  });
  console.log("sample", JSON.stringify(sample, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
