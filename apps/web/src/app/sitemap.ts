import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGES = ["", "/boutique", "/comment-ca-marche", "/faq", "/contact", "/vendeur", "/conditions", "/confidentialite"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/boutique" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/boutique" ? 0.9 : 0.5,
  }));

  try {
    const products = await getProducts();
    return [...pages, ...products.map((p) => ({ url: `${SITE.url}/produits/${p.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }))];
  } catch {
    return pages;
  }
}
