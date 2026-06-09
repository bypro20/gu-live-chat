import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBalance, isConfigured, type SmmProvider } from "@/lib/smm-api";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const provider = (new URL(req.url).searchParams.get("provider") || "moresmm") as SmmProvider;
  if (!isConfigured(provider)) {
    return NextResponse.json({ error: `${provider} API key tanımlı değil` }, { status: 400 });
  }
  try {
    const balance = await getBalance(provider);
    return NextResponse.json({ ...balance, provider });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
