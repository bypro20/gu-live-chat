import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { parseQuantityFromPackageName } from "../src/lib/validators";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const adminPass = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@prmdia.com" },
    update: {},
    create: {
      email: "admin@prmdia.com",
      password: adminPass,
      name: "ProMedia Admin",
      role: "ADMIN",
    },
  });

  const packages = [
    {
      name: "100 Ucuz Global Takipçi",
      slug: "ig-100-ucuz-takipci",
      platform: "INSTAGRAM",
      category: "Takipçi",
      tag: "EN UCUZ",
      price: 14.9,
      description: "Instagram — ucuz global takipçi, hızlı başlangıç",
      features: JSON.stringify(["0-15 dk başlangıç", "Şifre istenmez", "30 gün telafi"]),
      sortOrder: 1,
    },
    {
      name: "500 Ucuz Global Beğeni",
      slug: "ig-500-ucuz-begeni",
      platform: "INSTAGRAM",
      category: "Beğeni",
      tag: "UCUZ",
      price: 9.9,
      description: "Instagram — ucuz global beğeni paketi",
      features: JSON.stringify(["Anında başlar", "Gönderi linki yeterli", "30 gün telafi"]),
      sortOrder: 2,
    },
    {
      name: "250 Türk Takipçi",
      slug: "ig-250-turk-takipci",
      platform: "INSTAGRAM",
      category: "Takipçi",
      tag: "TÜRK",
      price: 139.9,
      description: "Instagram — Türk takipçi, yüksek kalite",
      features: JSON.stringify(["Kademeli teslimat", "Gerçek görünümlü profiller", "90 gün telafi"]),
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: "100 Global Takipçi",
      slug: "ig-100-global-takipci",
      platform: "INSTAGRAM",
      category: "Takipçi",
      tag: "GLOBAL",
      price: 29.9,
      description: "Instagram — global takipçi paketi",
      features: JSON.stringify(["Hızlı başlangıç", "Şifre gerekmez", "30 gün telafi"]),
      sortOrder: 4,
    },
    {
      name: "5.000 Türk Takipçi",
      slug: "ig-5000-turk-takipci",
      platform: "INSTAGRAM",
      category: "Takipçi",
      tag: "TÜRK",
      price: 549.9,
      description: "Instagram — büyük Türk takipçi paketi",
      features: JSON.stringify(["Kademeli teslimat", "Yüksek kalite", "90 gün telafi"]),
      sortOrder: 5,
    },
    {
      name: "100 Ucuz TikTok Takipçi",
      slug: "tt-100-ucuz-takipci",
      platform: "TIKTOK",
      category: "Takipçi",
      tag: "EN UCUZ",
      price: 12.9,
      description: "TikTok — ucuz global takipçi",
      features: JSON.stringify(["Hızlı başlangıç", "Hesap güvenliği", "30 gün telafi"]),
      sortOrder: 6,
    },
    {
      name: "1.000 TikTok Global Takipçi",
      slug: "tt-1000-global-takipci",
      platform: "TIKTOK",
      category: "Takipçi",
      tag: "GLOBAL",
      price: 79.9,
      description: "TikTok — global takipçi paketi",
      features: JSON.stringify(["Hızlı teslimat", "Hesap güvenliği", "30 gün telafi"]),
      sortOrder: 7,
    },
    {
      name: "1000 Ucuz TikTok İzlenme",
      slug: "tt-1000-ucuz-izlenme",
      platform: "TIKTOK",
      category: "İzlenme",
      tag: "UCUZ",
      price: 8.9,
      description: "TikTok — ucuz izlenme paketi",
      features: JSON.stringify(["Anında başlar", "Video linki yeterli", "30 gün telafi"]),
      sortOrder: 8,
    },
    {
      name: "100 Ucuz YouTube Abone",
      slug: "yt-100-ucuz-abone",
      platform: "YOUTUBE",
      category: "Abone",
      tag: "EN UCUZ",
      price: 19.9,
      description: "YouTube — ucuz global abone",
      features: JSON.stringify(["Kanal linki ile", "Kademeli tamamlanır", "30 gün telafi"]),
      sortOrder: 9,
    },
    {
      name: "1.000 YouTube Global Abone",
      slug: "yt-1000-global-abone",
      platform: "YOUTUBE",
      category: "Abone",
      tag: "GLOBAL",
      price: 149.9,
      description: "YouTube — global abone paketi",
      features: JSON.stringify(["Kanal linki ile", "Kademeli teslimat", "30 gün telafi"]),
      sortOrder: 10,
    },
    {
      name: "100 Ucuz Twitter Takipçi",
      slug: "tw-100-ucuz-takipci",
      platform: "TWITTER",
      category: "Takipçi",
      tag: "EN UCUZ",
      price: 11.9,
      description: "Twitter (X) — ucuz global takipçi",
      features: JSON.stringify(["Hızlı başlangıç", "Şifre gerekmez", "30 gün telafi"]),
      sortOrder: 11,
    },
    {
      name: "500 Twitter Global Takipçi",
      slug: "tw-500-global-takipci",
      platform: "TWITTER",
      category: "Takipçi",
      tag: "GLOBAL",
      price: 49.9,
      description: "Twitter (X) — global takipçi",
      features: JSON.stringify(["Hızlı başlangıç", "Şifre gerekmez", "30 gün telafi"]),
      sortOrder: 12,
    },
  ];

  for (const pkg of packages) {
    const smmQuantity = parseQuantityFromPackageName(pkg.name);
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: { ...pkg, smmQuantity },
      create: { ...pkg, smmQuantity },
    });
  }

  console.log("Seed OK — admin@prmdia.com");
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("Varsayılan şifre: admin123 (production'da SEED_ADMIN_PASSWORD kullanın)");
  }
  console.log(`${packages.length} paket yüklendi`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
