import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/top-bar";
import { TrustBar } from "@/components/trust-bar";
import { CookieBanner } from "@/components/cookie-banner";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — Instagram Takipçi Satın Al | Sosyal Medya Büyüme`,
  description:
    "ProMedia ile güvenli sosyal medya büyüme hizmetleri. iyzico ile güvenli ödeme, hızlı teslimat, 7/24 destek.",
  metadataBase: new URL(SITE.url),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased">
        <TopBar />
        <TrustBar />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
