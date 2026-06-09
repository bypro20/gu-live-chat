import { NextResponse } from "next/server";

/** Eski lead-form endpoint — artık /api/iyzico/checkout kullanılıyor */
export async function POST() {
  return NextResponse.json(
    { error: "Lütfen güvenli ödeme akışını kullanın: /paketler" },
    { status: 410 }
  );
}
