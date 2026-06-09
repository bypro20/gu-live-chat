import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferralCode, hashPassword } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/validators";
import { notifyNewReseller } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok fazla kayıt denemesi" }, { status: 429 });
  }

  const { name, email, password, agencyName, phone, whatsapp } = await req.json();
  if (!name || !email || !password || !agencyName) {
    return NextResponse.json({ error: "Zorunlu alanları doldurun" }, { status: 400 });
  }

  if (!isValidEmail(String(email))) {
    return NextResponse.json({ error: "Geçerli e-posta girin" }, { status: 400 });
  }

  if (String(password).length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(String(email));
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
  }

  let code = generateReferralCode(agencyName);
  while (await prisma.resellerProfile.findUnique({ where: { referralCode: code } })) {
    code = generateReferralCode(agencyName + Math.random());
  }

  const hashed = await hashPassword(String(password));
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: String(name).trim(),
      role: "RESELLER",
      reseller: {
        create: {
          agencyName: String(agencyName).trim(),
          phone: phone ? String(phone).trim() : null,
          whatsapp: whatsapp ? String(whatsapp).trim() : null,
          referralCode: code,
          isActive: false,
        },
      },
    },
  });

  void notifyNewReseller({
    agencyName: String(agencyName).trim(),
    email: normalizedEmail,
  });

  return NextResponse.json({
    ok: true,
    message: "Başvurunuz alındı. Admin onayı sonrası panele giriş yapabilirsiniz.",
  });
}
