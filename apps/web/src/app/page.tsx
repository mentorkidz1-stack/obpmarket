import { getBanners, getLatestReferencePrices, getMarkets, getProducts } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { ShopGrid } from "@/components/shop-grid";
import { TrendPanel } from "@/components/trend-panel";
import { BannerCarousel } from "@/components/banner-carousel";

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
  const categoryCount = new Set(products.map((p) => p.categoryId)).size;

  const stats = [
    { label: "Produits", value: products.length },
    { label: "Marchés suivis", value: markets.length },
    { label: "Catégories", value: categoryCount },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      <section className="grid gap-5 py-8 sm:grid-cols-[1.4fr_1fr] sm:items-center sm:py-12">
        <div className="grid gap-3">
          <h1 className="max-w-md font-display text-3xl font-bold leading-tight sm:text-4xl">
            Le prix du marché, au jour le jour.
          </h1>
          <p className="max-w-md text-sm text-ink-2">
            Prix moyen calculé à partir des relevés de nos agents sur les marchés du Bénin. Achetez au prix juste,
            retirez au magasin ou laissez en dépôt.
          </p>
          {lastUpdate && (
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <span className="size-2 rounded-full bg-accent shadow-[0_0_0_4px_var(--color-accent-soft)]" />
              <span>
                Prix mis à jour <span className="font-semibold text-ink">{formatRelativeTime(lastUpdate)}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface px-3 py-3 text-center sm:py-4">
              <p className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{s.value}</p>
              <p className="text-[11px] text-ink-2 sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <BannerCarousel banners={banners} />

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-2">
          Aucun produit pour l&apos;instant. Lancez le script de seed côté API (
          <code className="font-mono">npm run seed</code>).
        </p>
      ) : (
        <>
          <TrendPanel
            items={products.flatMap((product) => {
              const price = priceByProduct.get(product.id);
              return price ? [{ product, price }] : [];
            })}
          />
          <ShopGrid products={products} prices={priceByProduct} initialCategoryId={categoryParam} />
        </>
      )}
    </main>
  );
}
