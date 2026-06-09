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
  const body = await req.json();
  const data: {
    smmProvider?: string | null;
    smmServiceId?: number | null;
    smmQuantity?: number | null;
    isActive?: boolean;
  } = {};

  if ("smmProvider" in body) {
    const p = body.smmProvider;
    data.smmProvider = p === "" || p === null ? null : String(p);
  }
  if ("smmServiceId" in body) {
    data.smmServiceId =
      body.smmServiceId === "" || body.smmServiceId === null
        ? null
        : Number(body.smmServiceId);
  }
  if ("smmQuantity" in body) {
    data.smmQuantity =
      body.smmQuantity === "" || body.smmQuantity === null
        ? null
        : Number(body.smmQuantity);
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  const pkg = await prisma.package.update({ where: { id }, data });
  return NextResponse.json({ ok: true, package: pkg });
}
