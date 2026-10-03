import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLatestReferencePrices,
  getMarketPrices,
  getProduct,
  getProducts,
  getReferencePriceHistory,
  parseProductPhotos,
  type Product,
} from "@/lib/api";
import { SITE } from "@/lib/site";
import { ProductView } from "./product-view";

async function loadProduct(id: string): Promise<Product | null> {
  try {
    return await getProduct(id);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps<"/produits/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await loadProduct(id);
  if (!product) return { title: "Produit introuvable" };
  const photo = parseProductPhotos(product)[0];
  return {
    title: product.name,
    description: `${product.name} (${product.unitLabel}) au prix moyen du marché au Bénin, calculé sur les relevés de terrain d'OBP Market.`,
    openGraph: photo && !photo.startsWith("data:") ? { images: [photo] } : undefined,
  };
}

export default async function ProductPage(props: PageProps<"/produits/[id]">) {
  const { id } = await props.params;

  // Tout est chargé côté serveur, en parallèle : la fiche s'affiche complète, sans écran de chargement.
  const [product, history, all, prices, marketPrices] = await Promise.all([
    loadProduct(id),
    getReferencePriceHistory(id, 30).catch(() => []),
    getProducts().catch(() => [] as Product[]),
    getLatestReferencePrices().catch(() => []),
    getMarketPrices(id).catch(() => []),
  ]);
  if (!product) notFound();

  const priceById = new Map(prices.map((p) => [p.productId, p]));
  const related = all
    .filter((p) => p.categoryId === product.categoryId && p.id !== id)
    .slice(0, 4)
    .map((p) => ({ product: p, price: priceById.get(p.id) }));

  const latest = history.at(-1);
  const photos = parseProductPhotos(product).filter((p) => !p.startsWith("data:"));

  // Données structurées : prix et disponibilité affichables directement dans Google.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${product.name} (${product.unitLabel}) au prix moyen du marché au Bénin.`,
    category: product.category.name,
    image: photos,
    brand: { "@type": "Brand", name: SITE.name },
    ...(latest
      ? {
          offers: {
            "@type": "Offer",
            price: Math.round(latest.value),
            priceCurrency: "XOF",
            availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE.url}/produits/${product.id}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView id={id} initialProduct={product} initialHistory={history} related={related} marketPrices={marketPrices} />
    </>
  );
}
