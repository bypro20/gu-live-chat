import { prisma } from "@/lib/prisma";
import { getOrderStatus, type SmmProvider } from "@/lib/smm-api";

const COMPLETED_STATUSES = new Set([
  "completed",
  "complete",
  "finished",
  "done",
  "partial",
]);

export async function syncPendingSmmOrders(limit = 50) {
  const orders = await prisma.order.findMany({
    where: {
      smmOrderId: { not: null },
      status: { in: ["ACTIVE", "PAID"] },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;

  for (const order of orders) {
    if (!order.smmOrderId || !order.smmProvider) continue;

    try {
      const status = await getOrderStatus(
        order.smmProvider as SmmProvider,
        order.smmOrderId
      );
      const label = status.status || "unknown";
      const normalized = label.toLowerCase();

      const data: { smmStatus: string; status?: "COMPLETED" } = {
        smmStatus: label,
      };

      if (COMPLETED_STATUSES.has(normalized)) {
        data.status = "COMPLETED";
      }

      await prisma.order.update({ where: { id: order.id }, data });
      updated += 1;
    } catch (e) {
      console.error("[smm-sync]", order.orderCode, e);
    }
  }

  return { checked: orders.length, updated };
}
