import { isIyzicoConfigured } from "@/lib/iyzico";
import { getProviderList } from "@/lib/smm-api";

export type ServiceDefinition = {
  id: string;
  name: string;
  category: "odeme" | "teslimat" | "bildirim" | "guvenlik" | "veritabani";
  configured: boolean;
  required: boolean;
  envVars: string[];
  setupUrl: string;
  docsUrl?: string;
  principle: string;
  howToGet: string[];
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getAllServices(): ServiceDefinition[] {
  const smm = getProviderList();

  return [
    {
      id: "iyzico",
      name: "iyzico Ödeme",
      category: "odeme",
      configured: isIyzicoConfigured(),
      required: true,
      envVars: ["IYZICO_API_KEY", "IYZICO_SECRET_KEY", "IYZICO_SANDBOX"],
      setupUrl: "https://merchant.iyzico.com/auth/register",
      docsUrl: "https://dev.iyzico.com",
      principle:
        "Müşteri kart bilgisi sizde tutulmaz; iyzico 3D Secure checkout formu açar, callback ile ödeme doğrulanır.",
      howToGet: [
        "merchant.iyzico.com üzerinden üye işyeri başvurusu yapın",
        "Onay sonrası Ayarlar → API Anahtarları bölümünden API Key ve Secret Key alın",
        "Sandbox test için IYZICO_SANDBOX=true, canlıda false yapın",
        "Callback URL: https://SITENIZ.com/api/iyzico/callback",
      ],
    },
    {
      id: "moresmm",
      name: "MoreSMM Teslimat",
      category: "teslimat",
      configured: smm.find((p) => p.id === "moresmm")?.configured ?? false,
      required: true,
      envVars: ["MORESMM_API_URL", "MORESMM_API_KEY"],
      setupUrl: "https://moresmm.com",
      principle:
        "SMM panel API v2 — bakiye, servis listesi, sipariş ekleme ve durum sorgulama. POST form-urlencoded.",
      howToGet: [
        "moresmm.com hesabı açın ve bakiye yükleyin",
        "Hesap → API bölümünden API Key kopyalayın",
        "MORESMM_API_URL=https://moresmm.com/api/v2",
        "Admin panel → SMM API → servis ID'lerini paketlere eşleyin",
      ],
    },
    {
      id: "jap",
      name: "JustAnotherPanel Teslimat",
      category: "teslimat",
      configured: smm.find((p) => p.id === "jap")?.configured ?? false,
      required: false,
      envVars: ["JAP_API_URL", "JAP_API_KEY"],
      setupUrl: "https://justanotherpanel.com",
      principle: "MoreSMM ile aynı API v2 formatı; yedek panel veya fiyat karşılaştırma için kullanılır.",
      howToGet: [
        "justanotherpanel.com hesabı açın",
        "API Key bölümünden anahtarı alın",
        "JAP_API_URL=https://justanotherpanel.com/api/v2",
      ],
    },
    {
      id: "auto-smm",
      name: "Otomatik SMM Gönderimi",
      category: "teslimat",
      configured: process.env.AUTO_SMM_FULFILL === "true",
      required: false,
      envVars: ["AUTO_SMM_FULFILL"],
      setupUrl: "/panel/paketler",
      principle:
        "Ödeme onaylandığında paketteki smmServiceId ile SMM paneline otomatik sipariş açar.",
      howToGet: [
        ".env içinde AUTO_SMM_FULFILL=true yapın",
        "Panel → Paketler → her pakete smmProvider + smmServiceId tanımlayın",
        "En az bir SMM API key (MoreSMM veya JAP) aktif olmalı",
      ],
    },
    {
      id: "cron",
      name: "SMM Durum Cron",
      category: "teslimat",
      configured: hasEnv("CRON_SECRET"),
      required: false,
      envVars: ["CRON_SECRET"],
      setupUrl: "https://vercel.com/docs/cron-jobs",
      principle:
        "Aktif SMM siparişlerinin durumunu periyodik sorgular; tamamlananları COMPLETED yapar.",
      howToGet: [
        "CRON_SECRET=openssl rand -hex 32 ile üretin",
        "Vercel Cron: GET /api/cron/smm-sync, header Authorization: Bearer CRON_SECRET",
        "Önerilen: her 15–30 dakikada bir",
      ],
    },
    {
      id: "jwt",
      name: "Oturum Güvenliği (JWT)",
      category: "guvenlik",
      configured: hasEnv("JWT_SECRET"),
      required: true,
      envVars: ["JWT_SECRET"],
      setupUrl: "",
      principle: "Admin ve bayi panel oturumları imzalı JWT cookie ile korunur.",
      howToGet: [
        "Terminal: openssl rand -base64 32",
        "Vercel Environment Variables → JWT_SECRET",
        "Production'da varsayılan secret kullanılamaz",
      ],
    },
    {
      id: "email",
      name: "E-posta Bildirimleri (Resend)",
      category: "bildirim",
      configured: hasEnv("RESEND_API_KEY"),
      required: false,
      envVars: ["RESEND_API_KEY", "EMAIL_FROM"],
      setupUrl: "https://resend.com/signup",
      docsUrl: "https://resend.com/docs",
      principle:
        "Yeni sipariş, ödeme onayı ve telafi taleplerinde admin + müşteriye e-posta gönderir.",
      howToGet: [
        "resend.com hesabı açın",
        "API Keys → Create API Key → RESEND_API_KEY",
        "Domain doğrulayın (prmdia.com) veya test için onboarding@resend.dev",
        "EMAIL_FROM=ProMedia <noreply@prmdia.com>",
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp Bildirimleri (Meta Cloud)",
      category: "bildirim",
      configured:
        hasEnv("WHATSAPP_ACCESS_TOKEN") && hasEnv("WHATSAPP_PHONE_NUMBER_ID"),
      required: false,
      envVars: [
        "WHATSAPP_ACCESS_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "ADMIN_WHATSAPP_NUMBER",
      ],
      setupUrl: "https://developers.facebook.com/apps/",
      docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
      principle:
        "Yeni sipariş/ödeme anında admin WhatsApp numarasına metin mesajı gönderir.",
      howToGet: [
        "Meta Developer hesabı → Yeni uygulama → WhatsApp ürününü ekle",
        "WhatsApp → API Setup → Phone number ID ve geçici/permanent token alın",
        "Test numaranızı alıcı olarak kaydedin veya iş numarası onaylatın",
        "ADMIN_WHATSAPP_NUMBER=905xxxxxxxxx (ülke kodu, + olmadan)",
      ],
    },
    {
      id: "telegram",
      name: "Telegram Admin Bot",
      category: "bildirim",
      configured: hasEnv("TELEGRAM_BOT_TOKEN") && hasEnv("TELEGRAM_ADMIN_CHAT_ID"),
      required: false,
      envVars: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID"],
      setupUrl: "https://t.me/BotFather",
      docsUrl: "https://core.telegram.org/bots/api",
      principle: "Yedek/admin bildirim kanalı; sipariş ve telafi uyarıları Telegram'a düşer.",
      howToGet: [
        "Telegram'da @BotFather → /newbot → token alın → TELEGRAM_BOT_TOKEN",
        "Botunuza /start yazın, chat ID için @userinfobot veya getUpdates API kullanın",
        "TELEGRAM_ADMIN_CHAT_ID=123456789",
      ],
    },
    {
      id: "database",
      name: "Veritabanı (Production)",
      category: "veritabani",
      configured:
        hasEnv("DATABASE_URL") &&
        !process.env.DATABASE_URL?.includes("file:./dev.db"),
      required: false,
      envVars: ["DATABASE_URL"],
      setupUrl: "https://turso.tech",
      docsUrl: "https://www.prisma.io/docs/orm/overview/databases/turso",
      principle:
        "Canlı ortamda SQLite yerine Turso/Postgres kullanın; eşzamanlı siparişler için gerekli.",
      howToGet: [
        "Turso.tech → database oluştur → libsql URL + auth token",
        "Vercel'de DATABASE_URL ve TURSO_AUTH_TOKEN tanımlayın",
        "npx prisma db push ile şemayı uygulayın",
      ],
    },
  ];
}

export function getServiceSummary() {
  const services = getAllServices();
  const required = services.filter((s) => s.required);
  const missingRequired = required.filter((s) => !s.configured);
  const ready = missingRequired.length === 0;

  return {
    ready,
    total: services.length,
    configured: services.filter((s) => s.configured).length,
    missingRequired: missingRequired.map((s) => s.id),
    services,
  };
}
