"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product, ReferencePrice } from "@/lib/api";

export function ShopGrid({
  products,
  prices,
  initialCategoryId,
  initialQuery = "",
}: {
  products: Product[];
  prices: Map<string, ReferencePrice>;
  initialCategoryId?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(initialCategoryId ?? null);

  const categories = useMemo(
    () => [...new Map(products.map((p) => [p.category.id, p.category])).values()].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [products],
  );

  const filtered = products
    .filter((p) => !category || p.categoryId === category)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const pillClass = (active: boolean) =>
    `shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
      active ? "bg-brand text-on-brand" : "bg-surface text-ink-2 border border-line hover:text-ink"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button type="button" onClick={() => setCategory(null)} className={pillClass(!category)}>
            Tout
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={pillClass(category === c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <label className="relative sm:w-72">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4-4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer les produits…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-2">Aucun produit ne correspond à cette recherche.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} price={prices.get(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
