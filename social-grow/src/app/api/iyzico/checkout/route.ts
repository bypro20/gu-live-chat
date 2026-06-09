import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializeCheckoutForm } from "@/lib/iyzico";
import { generateOrderCode } from "@/lib/order-code";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      targetLink,
      packageId,
      referralCode,
    } = body;

    if (!customerName || !customerEmail || !packageId || !targetLink) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const pkg = await prisma.package.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    let resellerId: string | null = null;
    let commission = 0;
    if (referralCode) {
      const reseller = await prisma.resellerProfile.findUnique({
        where: { referralCode: String(referralCode).toUpperCase() },
      });
      if (reseller?.isActive) {
        resellerId = reseller.id;
        commission = pkg.price * (reseller.commissionRate / 100);
      }
    }

    const orderCode = generateOrderCode();
    const forwarded = request.headers.get("x-forwarded-for");
    const userIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const order = await prisma.order.create({
      data: {
        orderCode,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim().toLowerCase(),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        targetLink: String(targetLink).trim(),
        packageId: pkg.id,
        resellerId,
        amount: pkg.price,
        commission,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    const callbackUrl = `${baseUrl}/api/iyzico/callback`;

    const checkout = await initializeCheckoutForm({
      conversationId: orderCode,
      basketId: orderCode,
      priceTry: pkg.price,
      itemName: pkg.name,
      callbackUrl,
      buyerEmail: order.customerEmail,
      buyerName: order.customerName,
      buyerPhone: order.customerPhone || undefined,
      buyerIp: userIp,
    });

    if ("error" in checkout) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", paymentStatus: "FAILED" },
      });
      return NextResponse.json({ error: checkout.error }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { iyzicoToken: checkout.token },
    });

    return NextResponse.json({
      orderCode,
      token: checkout.token,
      checkoutFormContent: checkout.checkoutFormContent,
      paymentPageUrl: checkout.paymentPageUrl,
      amount: pkg.price,
      packageName: pkg.name,
    });
  } catch (error) {
    console.error("[iyzico checkout]", error);
    return NextResponse.json({ error: "Ödeme başlatılamadı" }, { status: 500 });
  }
}
