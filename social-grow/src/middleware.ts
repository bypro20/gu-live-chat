import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session-token";

const ADMIN_PANEL_PREFIXES = [
  "/panel/siparisler",
  "/panel/bayiler",
  "/panel/leads",
  "/panel/smm",
  "/panel/telafi",
  "/panel/servisler",
  "/panel/paketler",
];

const ADMIN_API_PREFIXES = ["/api/smm", "/api/refill", "/api/admin", "/api/packages"];

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return securityHeaders(NextResponse.redirect(url));
  }

  const token = request.cookies.get("grow_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/panel")) {
    if (!session) {
      const login = new URL("/giris", request.url);
      login.searchParams.set("next", pathname);
      return securityHeaders(NextResponse.redirect(login));
    }

    const needsAdmin = ADMIN_PANEL_PREFIXES.some((p) => pathname.startsWith(p));
    if (needsAdmin && session.role !== "ADMIN") {
      return securityHeaders(NextResponse.redirect(new URL("/panel", request.url)));
    }
  }

  if (pathname.startsWith("/api/orders/") && request.method !== "GET") {
    if (!session || session.role !== "ADMIN") {
      return securityHeaders(
        NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
      );
    }
  }

  if (ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!session || session.role !== "ADMIN") {
      return securityHeaders(
        NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
      );
    }
  }

  if (pathname.startsWith("/api/resellers/") && request.method !== "POST") {
    if (!session || session.role !== "ADMIN") {
      return securityHeaders(
        NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
      );
    }
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|payments/).*)",
};
