import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServices, isConfigured, type SmmProvider } from "@/lib/smm-api";

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
    const services = await getServices(provider);
    return NextResponse.json(services);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
