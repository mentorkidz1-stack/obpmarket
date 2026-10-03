import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product, ReferencePrice } from "@/lib/api";

export interface MoverItem {
  product: Product;
  price: ReferencePrice;
}

/** Les produits dont le prix du marché a le plus varié sur 7 jours — données réelles du calcul de prix. */
export function PriceMovers({ items }: { items: MoverItem[] }) {
  const withChange = items.filter((i) => i.price.changePct7d != null);
  if (withChange.length < 2) return null;

  const movers = [...withChange]
    .sort((a, b) => Math.abs(b.price.changePct7d!) - Math.abs(a.price.changePct7d!))
    .slice(0, 4);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Variations de prix · 7 jours</h2>
          <p className="mt-0.5 text-sm text-ink-2">Les produits dont le prix du marché a le plus bougé cette semaine.</p>
        </div>
        <Link href="/boutique?tri=hausse" className="flex-none text-sm font-semibold text-brand">
          Tout voir
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {movers.map(({ product, price }) => (
          <ProductCard key={product.id} product={product} price={price} />
        ))}
      </div>
    </section>
  );
}
