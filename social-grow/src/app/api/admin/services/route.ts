import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServiceSummary } from "@/lib/services-registry";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  return NextResponse.json(getServiceSummary());
}
