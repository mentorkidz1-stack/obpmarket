import type { Metadata } from "next";
import { getLatestReferencePrices, getProducts } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { ShopCatalog } from "@/components/shop-catalog";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Tous les produits au prix moyen du marché : céréales, huiles, légumes, tubercules et électroménager au Bénin.",
};

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function ShopPage(props: PageProps<"/boutique">) {
  const sp = await props.searchParams;

  let products, prices;
  try {
    [products, prices] = await Promise.all([getProducts(), getLatestReferencePrices()]);
  } catch {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-ink-2">Le catalogue est momentanément indisponible. Réessayez dans un instant.</p>
      </main>
    );
  }

  const priceByProduct = new Map(prices.map((p) => [p.productId, p]));
  const initial = {
    categorie: first(sp.categorie),
    q: first(sp.q),
    tri: first(sp.tri),
    vue: first(sp.vue),
    stock: first(sp.stock),
    type: first(sp.type),
    min: first(sp.min),
    max: first(sp.max),
  };

  return (
    <>
      <PageHero title="Boutique" crumb="Boutique" subtitle="Chaque prix est la moyenne des relevés faits par nos agents sur les marchés du Bénin." />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ShopCatalog key={JSON.stringify(initial)} products={products} prices={priceByProduct} initial={initial} />
      </main>
    </>
  );
}
