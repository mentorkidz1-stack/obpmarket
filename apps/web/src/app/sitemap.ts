import type { MetadataRoute } from "next";
import { getProducts, getProperties } from "@/lib/api";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGES = ["", "/boutique", "/immobilier", "/comment-ca-marche", "/faq", "/contact", "/vendeur", "/conditions", "/confidentialite"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/boutique" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/boutique" ? 0.9 : 0.5,
  }));

  const [products, properties] = await Promise.all([getProducts().catch(() => []), getProperties().catch(() => [])]);
  return [
    ...pages,
    ...products.map((p) => ({ url: `${SITE.url}/produits/${p.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...properties.map((p) => ({ url: `${SITE.url}/immobilier/${p.id}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
