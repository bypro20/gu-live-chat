import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  isValidOrderCode,
  normalizeEmail,
  normalizeOrderCode,
} from "@/lib/validators";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödeme alındı",
  ACTIVE: "İşleme alındı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
  FAILED: "Başarısız",
};

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limited = checkRateLimit(`lookup:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla sorgu. Lütfen bekleyin." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const code = request.nextUrl.searchParams.get("code")?.trim();
  const email = request.nextUrl.searchParams.get("email")?.trim();

  if (!code) {
    return NextResponse.json({ error: "Sipariş numarası gerekli" }, { status: 400 });
  }

  const orderCode = normalizeOrderCode(code);
  if (!isValidOrderCode(orderCode)) {
    return NextResponse.json({ error: "Geçersiz sipariş numarası formatı" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { package: { select: { name: true } } },
  });

  if (!order) {
    return NextResponse.json({ found: false });
  }

  if (email) {
    const normalizedEmail = normalizeEmail(email);
    if (order.customerEmail !== normalizedEmail) {
      return NextResponse.json({ found: false });
    }
  }

  return NextResponse.json({
    found: true,
    order: {
      orderCode: order.orderCode,
      packageName: order.package.name,
      amount: order.amount,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      paymentStatus: order.paymentStatus,
      smmStatus: order.smmStatus,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
    },
  });
}
