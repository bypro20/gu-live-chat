import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addOrder, isConfigured, type SmmProvider } from "@/lib/smm-api";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { orderId, serviceId, link, quantity, provider = "moresmm" } = await req.json();
  const smmProvider = provider as SmmProvider;

  if (!isConfigured(smmProvider)) {
    return NextResponse.json({ error: `${smmProvider} API key tanımlı değil` }, { status: 400 });
  }
  if (!orderId || !serviceId || !link || !quantity) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  try {
    const result = await addOrder(smmProvider, {
      service: Number(serviceId),
      link: String(link),
      quantity: Number(quantity),
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        smmProvider,
        smmOrderId: result.order,
        smmServiceId: Number(serviceId),
        smmQuantity: Number(quantity),
        smmStatus: "Gonderildi",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ ok: true, smmOrderId: result.order, provider: smmProvider });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
