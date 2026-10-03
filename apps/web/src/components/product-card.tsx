"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/components/cart-provider";
import { useUI } from "@/components/ui-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { Money } from "@/components/money";
import { formatRelativeTime } from "@/lib/format";
import type { Product, ReferencePrice } from "@/lib/api";

function Heart({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const { notify } = useUI();
  const active = has(product.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        const added = toggle(product.id);
        notify(added ? `${product.name} ajouté aux favoris` : `${product.name} retiré des favoris`, added ? { label: "Voir", href: "/favoris" } : undefined);
      }}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`grid size-9 place-items-center rounded-full bg-surface/95 shadow transition-colors hover:bg-surface ${active ? "text-down" : "text-ink"}`}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" />
      </svg>
    </button>
  );
}

/** Carte produit commune à la boutique, aux variations de prix, aux favoris et aux suggestions. */
export function ProductCard({
  product,
  price,
  layout = "grid",
}: {
  product: Product;
  price?: ReferencePrice;
  layout?: "grid" | "list";
}) {
  const { addItem } = useCart();
  const { notify } = useUI();

  const change = price?.changePct7d;
  const outOfStock = product.stockQuantity === 0;
  const lowStock = !outOfStock && product.stockQuantity <= 10;

  function add() {
    addItem(product, 1);
    notify(`${product.name} ajouté au panier`, { label: "Voir le panier", href: "/panier" });
  }

  const badges = (
    <>
      {change != null && (
        <span className={`absolute left-2.5 top-2.5 rounded-md px-2 py-1 font-mono text-[11px] font-bold text-white ${change >= 0 ? "bg-up" : "bg-down"}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)} %
        </span>
      )}
      {product.isPerishable && (
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-on-accent">Frais</span>
      )}
    </>
  );

  const stockLine = (
    <p className={`text-xs font-semibold ${outOfStock ? "text-down" : lowStock ? "text-accent" : "text-ink-2"}`}>
      {outOfStock ? "Rupture de stock" : lowStock ? `Plus que ${product.stockQuantity} en stock` : `${product.stockQuantity} en stock`}
    </p>
  );

  const priceBlock = price ? (
    <>
      <p className="font-display text-xl font-extrabold tabular-nums leading-tight">
        <Money value={price.value} unitClassName="text-xs font-semibold text-ink-2" />
      </p>
      <p className="font-mono text-[10.5px] text-ink-2">Prix du marché · {formatRelativeTime(price.computedAt)}</p>
    </>
  ) : (
    <p className="text-sm text-ink-2">Prix bientôt disponible</p>
  );

  const button = (
    <button
      type="button"
      onClick={add}
      disabled={!price || outOfStock}
      className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-on-brand transition-opacity disabled:opacity-40"
    >
      Ajouter au panier
    </button>
  );

  if (layout === "list") {
    return (
      <article className="group flex overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]">
        <Link href={`/produits/${product.id}`} className="relative block w-32 flex-none overflow-hidden sm:w-52">
          <ProductImage product={product} size="fill" className="transition-transform duration-300 group-hover:scale-105" />
          {badges}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{product.category.name}</p>
            <Link href={`/produits/${product.id}`}>
              <p className="font-display text-base font-bold leading-snug sm:text-lg">{product.name}</p>
            </Link>
            <p className="text-xs text-ink-2">{product.unitLabel}</p>
            <div className="mt-1.5">{stockLine}</div>
          </div>
          <div className="sm:w-52 sm:flex-none">
            <div className="mb-2.5">{priceBlock}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">{button}</div>
              <Heart product={product} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]">
      <div className="relative overflow-hidden">
        <Link href={`/produits/${product.id}`} className="block">
          <ProductImage product={product} size="card" className="transition-transform duration-300 group-hover:scale-105" />
        </Link>
        {badges}
        <div className="absolute right-2.5 top-2.5">
          <Heart product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{product.category.name}</p>
        <Link href={`/produits/${product.id}`}>
          <p className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-2">{product.unitLabel}</p>
        <div className="mt-2.5">{priceBlock}</div>
        <div className="mt-1.5">{stockLine}</div>
        <div className="mt-3">{button}</div>
      </div>
    </article>
  );
}
