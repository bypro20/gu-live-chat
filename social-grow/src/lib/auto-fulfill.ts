import { prisma } from "@/lib/prisma";
import { addOrder, isConfigured, type SmmProvider } from "@/lib/smm-api";
import { parseQuantityFromPackageName } from "@/lib/validators";

function normalizeLink(target?: string | null, platform?: string): string {
  if (!target) return "";
  if (target.startsWith("http")) return target;
  const handle = target.replace("@", "");
  if (platform === "YOUTUBE") return `https://youtube.com/@${handle}`;
  if (platform === "TIKTOK") return `https://tiktok.com/@${handle}`;
  if (platform === "TWITTER") return `https://x.com/${handle}`;
  return `https://instagram.com/${handle}`;
}

export async function autoFulfillOrder(orderId: string): Promise<{
  fulfilled: boolean;
  reason?: string;
  smmOrderId?: number;
}> {
  if (process.env.AUTO_SMM_FULFILL !== "true") {
    return { fulfilled: false, reason: "auto_disabled" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { package: true },
  });

  if (!order || order.smmOrderId) {
    return { fulfilled: false, reason: "skip" };
  }

  const provider = (order.package.smmProvider || "moresmm") as SmmProvider;
  const serviceId = order.package.smmServiceId;

  if (!serviceId || !isConfigured(provider)) {
    return { fulfilled: false, reason: "not_configured" };
  }

  const link = normalizeLink(order.targetLink, order.package.platform);
  if (!link) {
    return { fulfilled: false, reason: "missing_link" };
  }

  const quantity =
    order.package.smmQuantity ?? parseQuantityFromPackageName(order.package.name);

  try {
    const result = await addOrder(provider, {
      service: serviceId,
      link,
      quantity,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        smmProvider: provider,
        smmOrderId: result.order,
        smmServiceId: serviceId,
        smmQuantity: quantity,
        smmStatus: "Gonderildi",
        status: "ACTIVE",
      },
    });

    return { fulfilled: true, smmOrderId: result.order };
  } catch (e) {
    console.error("[auto-fulfill]", order.orderCode, e);
    return { fulfilled: false, reason: String(e) };
  }
}
