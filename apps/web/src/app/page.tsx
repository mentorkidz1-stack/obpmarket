import { getBanners, getLatestReferencePrices, getMarkets, getProducts } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { ShopGrid } from "@/components/shop-grid";
import { TrendPanel } from "@/components/trend-panel";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategorySidebar } from "@/components/category-sidebar";
import { CategoryTiles } from "@/components/category-tiles";
import { MarketStrip } from "@/components/market-strip";
import { TrustStrip } from "@/components/trust-strip";

export const revalidate = 30;

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const categoryParam = typeof searchParams.categorie === "string" ? searchParams.categorie : undefined;

  let products, prices, markets, banners;
  try {
    [products, prices, markets, banners] = await Promise.all([
      getProducts(),
      getLatestReferencePrices(),
      getMarkets(),
      getBanners(),
    ]);
  } catch {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-ink-2">
          Impossible de joindre l&apos;API OBP Market. Vérifiez qu&apos;elle tourne sur{" "}
          <code className="font-mono">http://localhost:3001</code>.
        </p>
      </main>
    );
  }

  const priceByProduct = new Map(prices.map((p) => [p.productId, p]));
  const lastUpdate = prices
    .map((p) => p.computedAt)
    .sort()
    .at(-1);

  const categoryCounts = new Map<string, { id: string; name: string; count: number }>();
  for (const p of products) {
    const entry = categoryCounts.get(p.category.id);
    if (entry) entry.count += 1;
    else categoryCounts.set(p.category.id, { id: p.category.id, name: p.category.name, count: 1 });
  }
  const categories = [...categoryCounts.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const stats = [
    { label: "Produits", value: products.length },
    { label: "Marchés suivis", value: markets.length },
    { label: "Catégories", value: categories.length },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      {banners.length > 0 ? (
        <section className="grid gap-4 pt-5 sm:pt-7 lg:grid-cols-[240px_1fr]">
          <CategorySidebar categories={categories} />
          <BannerCarousel banners={banners} />
        </section>
      ) : (
        <div className="pt-5 sm:pt-7" />
      )}

      <section className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-[28px]">
            Le prix du marché, au jour le jour.
          </h1>
          <p className="mt-1 max-w-lg text-sm text-ink-2">
            Prix moyen calculé à partir des relevés de nos agents sur les marchés du Bénin.
          </p>
          {lastUpdate && (
            <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
              <span className="size-2 rounded-full bg-accent shadow-[0_0_0_4px_var(--color-accent-soft)]" />
              <span>
                Prix mis à jour <span className="font-semibold text-ink">{formatRelativeTime(lastUpdate)}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface px-3 py-2.5 text-center sm:min-w-20">
              <p className="font-display text-xl font-bold tabular-nums sm:text-2xl">{s.value}</p>
              <p className="text-[11px] text-ink-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <CategoryTiles categories={categories} />
      <TrustStrip />

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-2">
          Aucun produit pour l&apos;instant. Lancez le script de seed côté API (
          <code className="font-mono">npm run seed</code>).
        </p>
      ) : (
        <>
          <div className="mt-8">
            <TrendPanel
              items={products.flatMap((product) => {
                const price = priceByProduct.get(product.id);
                return price ? [{ product, price }] : [];
              })}
            />
          </div>

          <MarketStrip markets={markets} />

          <section id="produits" className="scroll-mt-20 pt-8">
            <h2 className="font-display text-xl font-bold">Tous les produits</h2>
            <div className="mt-4">
              <ShopGrid products={products} prices={priceByProduct} initialCategoryId={categoryParam} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
