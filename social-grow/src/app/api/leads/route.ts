import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/validators";
import { notifyNewLead } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = checkRateLimit(`leads:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  const { name, email, phone, message, referralCode } = await req.json();
  if (!name || !email || !isValidEmail(String(email))) {
    return NextResponse.json({ error: "Geçerli ad ve e-posta gerekli" }, { status: 400 });
  }

  let resellerId: string | null = null;
  if (referralCode) {
    const reseller = await prisma.resellerProfile.findUnique({
      where: { referralCode: String(referralCode).toUpperCase() },
    });
    if (reseller) resellerId = reseller.id;
  }

  await prisma.lead.create({
    data: {
      name: String(name).trim(),
      email: normalizeEmail(String(email)),
      phone: phone ? String(phone).trim() : null,
      message: message ? String(message).trim() : null,
      resellerId,
    },
  });

  void notifyNewLead({
    name: String(name).trim(),
    email: normalizeEmail(String(email)),
    message: message ? String(message).trim() : null,
  });

  return NextResponse.json({ ok: true });
}
