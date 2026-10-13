import { getBanners, getLatestReferencePrices, getProducts, getProperties, parseProductPhotos } from "@/lib/api";
import { HomeFeed } from "@/components/home-feed";
import { PROPERTY_TYPES } from "@/lib/property";
import { buildHomeFeed } from "@/lib/home-feed";
import { HowItWorks } from "@/components/how-it-works";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategorySidebar } from "@/components/category-sidebar";
import { CategoryTiles, type CategoryCount } from "@/components/category-tiles";
import { PriceMovers } from "@/components/price-movers";
import { PromoBanners } from "@/components/promo-banners";
import { TrustStrip } from "@/components/trust-strip";

// Page régénérée au plus toutes les 30 s : servie instantanément depuis le CDN, sans attendre l'API.
export const revalidate = 30;

export default async function Home() {
  let products, prices, banners, properties;
  try {
    [products, prices, banners, properties] = await Promise.all([
      getProducts(),
      getLatestReferencePrices(),
      getBanners(),
      getProperties().catch(() => []),
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

  const feed = buildHomeFeed(products, priceByProduct, properties);

  const stats = [
    { label: "Produits", value: products.length },
    { label: "Biens immobiliers", value: properties.length },
    { label: "Catégories", value: categories.length },
  ];

  const propertyTypes = PROPERTY_TYPES.flatMap((t) => {
    const count = properties.filter((p) => p.type === t.value).length;
    return count > 0 ? [{ value: t.value, label: t.plural, count }] : [];
  });
  const propertyPhoto = properties.map((p) => parseProductPhotos(p)[0]).find(Boolean);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      {banners.length > 0 && (
        <section className="grid gap-4 pt-5 sm:pt-6 lg:grid-cols-[250px_1fr]">
          <CategorySidebar categories={categories} propertyTypes={propertyTypes} />
          <BannerCarousel banners={banners} />
        </section>
      )}

      <section className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${banners.length > 0 ? "mt-8" : "pt-6"}`}>
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-[30px]">
            Vos produits du quotidien et l&apos;immobilier, à prix accessibles.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            Produits agricoles, vivriers et électroménagers vendus par OBP Market et ses partenaires, avec retrait au magasin ou livraison. Parcelles, maisons et chambres proposées par OBP.
          </p>
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

      <CategoryTiles categories={categories} realEstate={{ count: properties.length, photo: propertyPhoto }} />

      <HomeFeed items={feed} productCount={products.length} propertyCount={properties.length} />

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

          <PromoBanners />
          <TrustStrip />
        </>
      )}
    </main>
  );
}
