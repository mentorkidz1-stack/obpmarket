import { getBanners, getLatestReferencePrices, getMarkets, getProducts, parseProductPhotos } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HowItWorks } from "@/components/how-it-works";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategorySidebar } from "@/components/category-sidebar";
import { CategoryTiles, type CategoryCount } from "@/components/category-tiles";
import { PriceMovers } from "@/components/price-movers";
import { PromoBanners } from "@/components/promo-banners";
import { MarketStrip } from "@/components/market-strip";
import { TrustStrip } from "@/components/trust-strip";

export default async function Home() {
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

  const categoryCounts = new Map<string, CategoryCount>();
  for (const p of products) {
    const photo = parseProductPhotos(p)[0];
    const entry = categoryCounts.get(p.category.id);
    if (entry) {
      entry.count += 1;
      if (!entry.photo && photo) entry.photo = photo;
    } else {
      categoryCounts.set(p.category.id, { id: p.category.id, name: p.category.name, count: 1, photo });
    }
  }
  const categories = [...categoryCounts.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  // Les produits déjà montrés dans « Variations de prix » ne sont pas répétés dessous.
  const moverIds = new Set(
    products
      .flatMap((p) => {
        const change = priceByProduct.get(p.id)?.changePct7d;
        return change == null ? [] : [{ id: p.id, abs: Math.abs(change) }];
      })
      .sort((a, b) => b.abs - a.abs)
      .slice(0, 4)
      .map((m) => m.id),
  );
  const featured = (moverIds.size >= 2 ? products.filter((p) => !moverIds.has(p.id)) : products).slice(0, 8);

  const stats = [
    { label: "Produits", value: products.length },
    { label: "Marchés suivis", value: markets.length },
    { label: "Catégories", value: categories.length },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      {banners.length > 0 && (
        <section className="grid gap-4 pt-5 sm:pt-6 lg:grid-cols-[250px_1fr]">
          <CategorySidebar categories={categories} />
          <BannerCarousel banners={banners} />
        </section>
      )}

      <section className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${banners.length > 0 ? "mt-8" : "pt-6"}`}>
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-[30px]">
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
            <div key={s.label} className="rounded-2xl border border-line bg-surface px-3 py-2.5 text-center sm:min-w-24">
              <p className="font-display text-xl font-extrabold tabular-nums sm:text-2xl">{s.value}</p>
              <p className="text-[11px] text-ink-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <CategoryTiles categories={categories} />

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-2">
          Aucun produit pour l&apos;instant. Lancez le script de seed côté API (
          <code className="font-mono">npm run seed</code>).
        </p>
      ) : (
        <>
          <PriceMovers
            items={products.flatMap((product) => {
              const price = priceByProduct.get(product.id);
              return price ? [{ product, price }] : [];
            })}
          />

          <HowItWorks />

          <section className="mt-10">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold">{featured.length < products.length ? "Découvrez aussi" : "Nos produits"}</h2>
              <Link href="/boutique" className="flex-none text-sm font-semibold text-brand">
                Toute la boutique →
              </Link>
            </div>
            {featured.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} price={priceByProduct.get(p.id)} />
                ))}
              </div>
            )}
            <div className="mt-6 text-center">
              <Link href="/boutique" className="inline-block rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app">
                Voir les {products.length} produits
              </Link>
            </div>
          </section>

          <PromoBanners />
          <TrustStrip />
          <MarketStrip markets={markets} />
        </>
      )}
    </main>
  );
}
