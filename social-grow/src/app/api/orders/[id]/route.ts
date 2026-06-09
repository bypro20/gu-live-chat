import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidOrderStatus } from "@/lib/validators";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = await req.json();

  if (!status || !isValidOrderStatus(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
