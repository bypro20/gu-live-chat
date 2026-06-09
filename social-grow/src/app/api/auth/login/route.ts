import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { reseller: true },
  });
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }
  if (user.role === "RESELLER" && user.reseller && !user.reseller.isActive) {
    return NextResponse.json({ error: "Hesabınız henüz onaylanmadı" }, { status: 403 });
  }
  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    referralCode: user.reseller?.referralCode,
    agencyName: user.reseller?.agencyName,
  });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set("grow_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
