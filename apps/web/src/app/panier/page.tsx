"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { createOrder } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { ProductImage } from "@/components/product-image";

export default function CartPage() {
  const router = useRouter();
  const { lines, ready, setQuantity, removeItem, clear } = useCart();
  const { user, token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => sum + l.quantity, 0);

  async function handleCheckout() {
    if (!token) {
      router.push("/connexion");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder(
        token,
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, fulfillment: l.fulfillment })),
      );
      clear();
      router.push(`/commandes/${order.id}/paiement`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la commande.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <PageHero title="Mon panier" crumb="Panier" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {lines.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
              <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.4-1l2-6.4H6.2" />
                <circle cx="9.5" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
              </svg>
            </span>
            <p className="mt-4 font-display text-lg font-extrabold">Votre panier est vide</p>
            <p className="mt-1 text-sm text-ink-2">Découvrez les prix du jour et ajoutez vos produits.</p>
            <Link href="/" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {lines.map((line) => (
                <li key={line.product.id} className="flex flex-wrap items-center gap-3 border-t border-line p-4 first:border-t-0 sm:gap-4">
                  <ProductImage product={line.product} size="md" />
                  <div className="min-w-0 flex-1 basis-40">
                    <Link href={`/produits/${line.product.id}`} className="block truncate font-display text-[15px] font-bold hover:text-brand">
                      {line.product.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                      <span>{line.product.unitLabel}</span>
                      {line.fulfillment === "DEPOT" && (
                        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">Dépôt</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center rounded-xl border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                      className="px-3 py-2 text-base font-bold"
                      aria-label={`Diminuer la quantité de ${line.product.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center font-mono text-sm font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                      disabled={line.quantity >= line.product.stockQuantity}
                      className="px-3 py-2 text-base font-bold disabled:opacity-40"
                      aria-label={`Augmenter la quantité de ${line.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.product.id)}
                    className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-down/10 hover:text-down"
                    aria-label={`Retirer ${line.product.name}`}
                  >
                    <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V4.5h6V7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-extrabold">Récapitulatif</h2>
              <div className="mt-3 flex items-center justify-between border-b border-line pb-3 text-sm">
                <span className="text-ink-2">Articles</span>
                <span className="font-semibold">{total}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-2">
                Le total exact est calculé au prix du marché au moment du paiement.
              </p>

              {!user && (
                <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-xs">Connectez-vous pour passer commande.</p>
              )}
              {error && <p className="mt-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={handleCheckout}
                className="mt-4 w-full rounded-xl bg-brand py-3.5 text-center text-sm font-bold text-on-brand disabled:opacity-60"
              >
                {busy ? "Validation…" : user ? "Commander et payer" : "Se connecter pour commander"}
              </button>
              <p className="mt-3 text-center text-[11px] text-ink-2">
                Paiement sécurisé : Mobile Money ou carte bancaire, à l&apos;étape suivante.
              </p>
              <Link href="/" className="mt-3 block text-center text-xs font-semibold text-brand">
                ← Continuer mes achats
              </Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
