import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const pages = [
    "",
    "/paketler",
    "/bayilik",
    "/hakkimizda",
    "/iletisim",
    "/siparis-sorgula",
    "/telafi-talebi",
    "/gizlilik",
    "/mesafeli-satis",
    "/teslimat-iade",
    "/odeme-guvenligi",
  ];

  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/paketler" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
