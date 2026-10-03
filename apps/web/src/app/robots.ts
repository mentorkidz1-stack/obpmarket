import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/backoffice", "/agent", "/connexion-interne", "/panier", "/commandes", "/compte", "/portefeuille", "/mon-stock"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
