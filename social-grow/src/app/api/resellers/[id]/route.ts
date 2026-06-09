import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const { isActive, commissionRate } = await req.json();

  const data: { isActive?: boolean; commissionRate?: number } = {};

  if (typeof isActive === "boolean") {
    data.isActive = isActive;
  }

  if (commissionRate !== undefined) {
    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 80) {
      return NextResponse.json({ error: "Komisyon 0–80 arasında olmalı" }, { status: 400 });
    }
    data.commissionRate = rate;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  await prisma.resellerProfile.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
