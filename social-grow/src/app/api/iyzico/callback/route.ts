import { NextRequest, NextResponse } from "next/server";
import { processIyzicoCallbackToken } from "@/lib/iyzico-process-payment";

function redirectUrl(
  request: NextRequest,
  status: "success" | "failed",
  orderCode?: string
) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const path =
    status === "success" ? "/odeme/basarili" : "/odeme/basarisiz";
  const url = new URL(path, base);
  if (orderCode) url.searchParams.set("code", orderCode);
  return NextResponse.redirect(url);
}

async function handleToken(
  request: NextRequest,
  token: string | null
) {
  if (!token) {
    return redirectUrl(request, "failed");
  }

  try {
    const result = await processIyzicoCallbackToken(token);
    if (!result.ok) {
      console.error("[iyzico callback]", result.error);
      return redirectUrl(request, "failed");
    }
    return redirectUrl(request, result.redirect, result.orderCode);
  } catch (error) {
    console.error("[iyzico callback]", error);
    return redirectUrl(request, "failed");
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token")?.toString() || null;
  return handleToken(request, token);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  return handleToken(request, token);
}
