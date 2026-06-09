import { SITE } from "@/lib/site";

type NotifyResult = { channel: string; ok: boolean; error?: string };

function adminWhatsAppNumber() {
  return process.env.ADMIN_WHATSAPP_NUMBER?.replace(/\D/g, "") || "";
}

export async function sendResendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY yok" };

  const from =
    process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;
  const to = Array.isArray(input.to) ? input.to : [input.to];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function sendWhatsAppText(message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = adminWhatsAppNumber();

  if (!token || !phoneId || !to) {
    return { ok: false, error: "WhatsApp env eksik" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message.slice(0, 4096) },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false, error: "Telegram env eksik" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message.slice(0, 4096),
          parse_mode: "HTML",
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "Telegram hatası" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function notifyAdmin(message: string): Promise<NotifyResult[]> {
  const results: NotifyResult[] = [];

  const wa = await sendWhatsAppText(message);
  results.push({ channel: "whatsapp", ok: wa.ok, error: wa.error });

  const tg = await sendTelegramMessage(message);
  results.push({ channel: "telegram", ok: tg.ok, error: tg.error });

  const adminEmail = process.env.ADMIN_EMAIL || SITE.email;
  const mail = await sendResendEmail({
    to: adminEmail,
    subject: `[${SITE.name}] Yeni bildirim`,
    html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
  });
  results.push({ channel: "email", ok: mail.ok, error: mail.error });

  return results;
}

export async function notifyOrderPaid(input: {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  amount: number;
}) {
  const adminMsg = [
    `✅ Yeni ödeme — ${SITE.name}`,
    `Sipariş: ${input.orderCode}`,
    `Müşteri: ${input.customerName}`,
    `Paket: ${input.packageName}`,
    `Tutar: ₺${input.amount.toLocaleString("tr-TR")}`,
  ].join("\n");

  void notifyAdmin(adminMsg);

  void sendResendEmail({
    to: input.customerEmail,
    subject: `${SITE.name} — Siparişiniz alındı (${input.orderCode})`,
    html: `
      <h2>Teşekkürler ${input.customerName}!</h2>
      <p>Siparişiniz (<strong>${input.orderCode}</strong>) ödendi ve işleme alındı.</p>
      <p><strong>Paket:</strong> ${input.packageName}</p>
      <p><strong>Tutar:</strong> ₺${input.amount.toLocaleString("tr-TR")}</p>
      <p>Durum sorgulama: <a href="${SITE.url}/siparis-sorgula">${SITE.url}/siparis-sorgula</a></p>
    `,
  });
}

export async function notifyNewLead(input: {
  name: string;
  email: string;
  message?: string | null;
}) {
  void notifyAdmin(
    [`📩 Yeni iletişim formu`, `Ad: ${input.name}`, `E-posta: ${input.email}`, input.message || ""]
      .filter(Boolean)
      .join("\n")
  );
}

export async function notifyNewReseller(input: {
  agencyName: string;
  email: string;
}) {
  void notifyAdmin(
    [`🤝 Yeni bayi başvurusu`, `Ajans: ${input.agencyName}`, `E-posta: ${input.email}`, `Onay: /panel/bayiler`].join(
      "\n"
    )
  );
}

export async function notifyRefillRequest(input: {
  orderCode: string;
  username: string;
}) {
  void notifyAdmin(
    [`🔄 Telafi talebi`, `Sipariş: ${input.orderCode}`, `Kullanıcı: ${input.username}`, `Panel: /panel/telafi`].join(
      "\n"
    )
  );
}
