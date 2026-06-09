import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isValidOrderCode, normalizeOrderCode } from "@/lib/validators";
import { notifyRefillRequest } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = checkRateLimit(`refill:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla talep. Lütfen bekleyin." },
      { status: 429 }
    );
  }

  const { orderCode, username, note } = await req.json();
  if (!orderCode || !username) {
    return NextResponse.json({ error: "Sipariş no ve kullanıcı adı gerekli" }, { status: 400 });
  }

  const code = normalizeOrderCode(String(orderCode));
  if (!isValidOrderCode(code)) {
    return NextResponse.json({ error: "Geçersiz sipariş numarası" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderCode: code } });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  if (order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Telafi yalnızca ödenmiş siparişler için geçerlidir" },
      { status: 400 }
    );
  }

  const existing = await prisma.refillRequest.findFirst({
    where: { orderCode: code, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu sipariş için bekleyen bir telafi talebi zaten var" },
      { status: 409 }
    );
  }

  await prisma.refillRequest.create({
    data: {
      orderCode: code,
      username: String(username).trim(),
      note: note ? String(note).trim() : null,
    },
  });

  void notifyRefillRequest({
    orderCode: code,
    username: String(username).trim(),
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const requests = await prisma.refillRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ requests });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  await prisma.refillRequest.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
