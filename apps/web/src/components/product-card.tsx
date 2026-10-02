"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/components/cart-provider";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import type { Product, ReferencePrice } from "@/lib/api";

/** Carte produit commune à la grille du catalogue et aux variations de prix. */
export function ProductCard({ product, price }: { product: Product; price?: ReferencePrice }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const change = price?.changePct7d;
  const outOfStock = product.stockQuantity === 0;
  const lowStock = !outOfStock && product.stockQuantity <= 10;

  function add() {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]">
      <Link href={`/produits/${product.id}`} className="relative block overflow-hidden">
        <ProductImage product={product} size="card" className="transition-transform duration-300 group-hover:scale-105" />
        {change != null && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-md px-2 py-1 font-mono text-[11px] font-bold text-white ${
              change >= 0 ? "bg-up" : "bg-down"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)} %
          </span>
        )}
        {product.isPerishable && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-on-accent">
            Frais
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{product.category.name}</p>
        <Link href={`/produits/${product.id}`}>
          <p className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-2">{product.unitLabel}</p>

        <div className="mt-2.5">
          {price ? (
            <>
              <p className="font-display text-xl font-extrabold tabular-nums leading-tight">
                {formatFCFA(price.value)} <small className="text-xs font-semibold text-ink-2">F</small>
              </p>
              <p className="font-mono text-[10.5px] text-ink-2">Prix du marché · {formatRelativeTime(price.computedAt)}</p>
            </>
          ) : (
            <p className="text-sm text-ink-2">Prix bientôt disponible</p>
          )}
        </div>

        <p className={`mt-1.5 text-xs font-semibold ${outOfStock ? "text-down" : lowStock ? "text-accent" : "text-ink-2"}`}>
          {outOfStock ? "Rupture de stock" : lowStock ? `Plus que ${product.stockQuantity} en stock` : `${product.stockQuantity} en stock`}
        </p>

        <button
          type="button"
          onClick={add}
          disabled={!price || outOfStock}
          className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-on-brand transition-opacity disabled:opacity-40"
        >
          {added ? "Ajouté ✓" : "Ajouter au panier"}
        </button>
      </div>
    </article>
  );
}
