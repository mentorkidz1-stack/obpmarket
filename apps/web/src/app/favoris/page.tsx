"use client";

import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/components/wishlist-provider";
import { useCatalog } from "@/lib/use-catalog";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { products, prices, loaded, error } = useCatalog();

  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);

  return (
    <>
      <PageHero title="Mes favoris" crumb="Favoris" subtitle="Les produits que vous suivez, gardés sur cet appareil." />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {error ? (
          <p className="py-16 text-center text-sm text-ink-2">Impossible de charger vos favoris pour le moment.</p>
        ) : !loaded ? (
          <p className="py-16 text-center text-sm text-ink-2">Chargement…</p>
        ) : saved.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
              <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" />
              </svg>
            </span>
            <p className="mt-4 font-display text-lg font-extrabold">Aucun favori pour l&apos;instant</p>
            <p className="mt-1 text-sm text-ink-2">Touchez le cœur d&apos;un produit pour le retrouver ici.</p>
            <Link href="/boutique" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {saved.map((p) => (
              <ProductCard key={p.id} product={p} price={prices.get(p.id)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
