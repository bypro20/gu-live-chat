import { autoFulfillOrder } from "@/lib/auto-fulfill";
import { prisma } from "@/lib/prisma";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { notifyOrderPaid } from "@/lib/notify";

export type PaymentProcessResult =
  | { ok: true; redirect: "success" | "failed"; orderCode?: string }
  | { ok: false; error: string };

export async function processIyzicoCallbackToken(
  token: string
): Promise<PaymentProcessResult> {
  const result = await retrieveCheckoutForm(token);

  if (result.status !== "success") {
    console.error("[iyzico] retrieve failed:", result);
    return { ok: true, redirect: "failed" };
  }

  const orderCode = result.basketId || result.conversationId;
  if (!orderCode) {
    return { ok: false, error: "Sipariş kimliği bulunamadı" };
  }

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { package: true },
  });

  if (!order) {
    return { ok: false, error: "Sipariş bulunamadı" };
  }

  if (order.paymentStatus === "PAID") {
    return { ok: true, redirect: "success", orderCode };
  }

  if (result.paymentStatus !== "SUCCESS") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", status: "FAILED" },
    });
    return { ok: true, redirect: "failed", orderCode };
  }

  const paidKurus = Math.round(parseFloat(result.paidPrice || "0") * 100);
  const expectedKurus = Math.round(order.amount * 100);
  if (expectedKurus > 0 && paidKurus !== expectedKurus) {
    console.error(
      `[iyzico] Amount mismatch for ${orderCode}: expected ${expectedKurus}, got ${paidKurus}`
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", status: "FAILED" },
    });
    return { ok: true, redirect: "failed", orderCode };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "ACTIVE",
        paidAt: new Date(),
        iyzicoToken: token,
      },
    });

    if (order.resellerId && order.commission > 0) {
      await tx.resellerProfile.update({
        where: { id: order.resellerId },
        data: { totalEarnings: { increment: order.commission } },
      });
    }
  });

  void autoFulfillOrder(order.id).catch((e) =>
    console.error("[auto-fulfill]", order.orderCode, e)
  );

  void notifyOrderPaid({
    orderCode: order.orderCode,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    packageName: order.package.name,
    amount: order.amount,
  });

  return { ok: true, redirect: "success", orderCode };
}
