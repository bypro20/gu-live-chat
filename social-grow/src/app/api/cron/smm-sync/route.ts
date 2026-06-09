import { NextRequest, NextResponse } from "next/server";
import { syncPendingSmmOrders } from "@/lib/smm-sync";

function authorize(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const query = req.nextUrl.searchParams.get("secret");
  return bearer === expected || query === expected;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const result = await syncPendingSmmOrders();
  return NextResponse.json({ ok: true, ...result });
}
