"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { PriceTrend } from "@/components/price-trend";
import { useCart } from "@/components/cart-provider";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import type { Product, ReferencePrice } from "@/lib/api";

export function ShopGrid({
  products,
  prices,
  initialCategoryId,
}: {
  products: Product[];
  prices: Map<string, ReferencePrice>;
  initialCategoryId?: string;
}) {
  const { addItem } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(initialCategoryId ?? null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Map(products.map((p) => [p.category.id, p.category])).values()].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [products],
  );

  const filtered = products
    .filter((p) => !category || p.categoryId === category)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function quickAdd(p: Product) {
    addItem(p, 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId((id) => (id === p.id ? null : id)), 1200);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1 sm:max-w-xs">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4-4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:justify-end">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${!category ? "bg-ink text-app" : "bg-surface-2 text-ink-2"}`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${category === c.id ? "bg-ink text-app" : "bg-surface-2 text-ink-2"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-2">Aucun produit ne correspond à cette recherche.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((p) => {
            const price = prices.get(p.id);
            return (
              <div key={p.id} className="group overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(15,31,26,0.35)]">
                <Link href={`/produits/${p.id}`} className="block">
                  <ProductImage product={p} size="card" className="transition-transform duration-200 group-hover:scale-[1.03]" />
                </Link>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded border px-1 py-px font-mono text-[10px] ${
                        p.isStockable ? "border-brand text-brand" : "border-accent text-accent"
                      }`}
                    >
                      {p.isStockable ? "Stockable" : "Frais"}
                    </span>
                    <PriceTrend value={price?.changePct7d} />
                  </div>
                  <Link href={`/produits/${p.id}`}>
                    <p className="mt-1 truncate font-display text-[15px] font-bold">{p.name}</p>
                  </Link>
                  <p className="text-xs text-ink-2">{p.unitLabel}</p>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      {price ? (
                        <>
                          <p className="font-display text-lg font-bold tabular-nums leading-tight">
                            {formatFCFA(price.value)} <small className="text-xs font-semibold text-ink-2">F</small>
                          </p>
                          <p className="truncate font-mono text-[10.5px] text-ink-2">{formatRelativeTime(price.computedAt)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-ink-2">Pas de prix</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => quickAdd(p)}
                      disabled={!price || p.stockQuantity === 0}
                      aria-label={`Ajouter ${p.name} au panier`}
                      className="grid size-9 flex-none place-items-center rounded-full bg-brand text-on-brand disabled:opacity-40"
                    >
                      {addedId === p.id ? (
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
