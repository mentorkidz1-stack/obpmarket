import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { PriceTrend } from "@/components/price-trend";
import { formatFCFA } from "@/lib/format";
import type { Product, ReferencePrice } from "@/lib/api";

export interface TrendItem {
  product: Product;
  price: ReferencePrice;
}

function TrendList({ title, items, tone }: { title: string; items: TrendItem[]; tone: "up" | "down" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className={`text-xs font-semibold ${tone === "up" ? "text-up" : "text-down"}`}>{title}</p>
      <ul className="mt-2 grid gap-2.5">
        {items.map(({ product, price }) => (
          <li key={product.id}>
            <Link href={`/produits/${product.id}`} className="flex items-center gap-2.5">
              <ProductImage product={product} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{product.name}</span>
                <span className="block font-mono text-xs text-ink-2">{formatFCFA(price.value)} F</span>
              </span>
              <PriceTrend value={price.changePct7d} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendPanel({ items }: { items: TrendItem[] }) {
  const withChange = items.filter((i) => i.price.changePct7d != null);
  if (withChange.length < 2) return null;

  const gainers = [...withChange].sort((a, b) => b.price.changePct7d! - a.price.changePct7d!).slice(0, 3);
  const losers = [...withChange].sort((a, b) => a.price.changePct7d! - b.price.changePct7d!).slice(0, 3);

  return (
    <section className="mb-8 grid gap-3 sm:grid-cols-2">
      <TrendList title="Plus fortes hausses · 7 j" items={gainers} tone="up" />
      <TrendList title="Plus fortes baisses · 7 j" items={losers} tone="down" />
    </section>
  );
}
