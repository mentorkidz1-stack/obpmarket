import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { PropertyCard } from "@/components/property-card";
import type { FeedItem } from "@/lib/home-feed";

/** « À la une » : produits du marché et biens immobiliers dans une même grille. */
export function HomeFeed({ items, productCount, propertyCount }: { items: FeedItem[]; productCount: number; propertyCount: number }) {
  if (items.length === 0) return null;

  return (
    <section id="a-la-une" className="mt-10 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">À la une</h2>
          <p className="mt-0.5 text-sm text-ink-2">Produits au prix du marché, parcelles, maisons et chambres, au même endroit.</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-brand">
          <Link href="/boutique">Les {productCount} produits →</Link>
          {propertyCount > 0 && <Link href="/immobilier">Les {propertyCount} biens →</Link>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) =>
          item.kind === "product" ? <ProductCard key={`p-${item.product.id}`} product={item.product} price={item.price} /> : <PropertyCard key={`h-${item.property.id}`} property={item.property} />,
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/boutique" className="inline-block rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app">
          Toute la boutique
        </Link>
        {propertyCount > 0 && (
          <Link href="/immobilier" className="inline-block rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app">
            Tout l&apos;immobilier
          </Link>
        )}
      </div>
    </section>
  );
}
