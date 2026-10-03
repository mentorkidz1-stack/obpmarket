"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useUI } from "@/components/ui-provider";
import { Money } from "@/components/money";
import { ProductImage } from "@/components/product-image";
import { useCatalog } from "@/lib/use-catalog";

/** Panier latéral : ouvert depuis l'icône du panier, comme le mini-panier de Motta. */
export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { lines, setQuantity, removeItem, count } = useCart();
  const { prices } = useCatalog(cartOpen);

  const estimate = lines.reduce((sum, l) => sum + (prices.get(l.product.id)?.value ?? 0) * l.quantity, 0);
  const complete = lines.every((l) => prices.has(l.product.id));

  return (
    <div className={`fixed inset-0 z-[60] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div
        onClick={() => setCartOpen(false)}
        className={`absolute inset-0 bg-[#0b0d20]/55 transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Mon panier"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">
            Mon panier <span className="text-sm font-semibold text-ink-2">({count})</span>
          </h2>
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Fermer le panier" className="grid size-9 place-items-center rounded-full hover:bg-surface-2">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.4-1l2-6.4H6.2" />
                  <circle cx="9.5" cy="20" r="1.3" />
                  <circle cx="17" cy="20" r="1.3" />
                </svg>
              </span>
              <p className="mt-4 font-display text-lg font-extrabold">Votre panier est vide</p>
              <p className="mt-1 text-sm text-ink-2">Ajoutez des produits au prix du marché du jour.</p>
              <Link href="/boutique" onClick={() => setCartOpen(false)} className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
                Voir la boutique
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto">
              {lines.map((line) => {
                const price = prices.get(line.product.id);
                return (
                  <li key={line.product.id} className="flex gap-3 border-b border-line px-5 py-4">
                    <ProductImage product={line.product} size="md" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/produits/${line.product.id}`} onClick={() => setCartOpen(false)} className="block truncate text-sm font-bold hover:text-brand">
                        {line.product.name}
                      </Link>
                      <p className="text-xs text-ink-2">
                        {line.product.unitLabel}
                        {line.fulfillment === "DEPOT" && <span className="ml-1.5 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">Dépôt</span>}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-line text-sm">
                          <button type="button" onClick={() => setQuantity(line.product.id, line.quantity - 1)} className="px-2.5 py-1 font-bold" aria-label="Diminuer">
                            −
                          </button>
                          <span className="min-w-6 text-center font-mono text-xs font-semibold">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                            disabled={line.quantity >= line.product.stockQuantity}
                            className="px-2.5 py-1 font-bold disabled:opacity-40"
                            aria-label="Augmenter"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-display text-sm font-extrabold tabular-nums">{price ? <Money value={price.value * line.quantity} /> : "—"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(line.product.id)} aria-label={`Retirer ${line.product.name}`} className="self-start text-ink-2 hover:text-down">
                      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-2">Total estimé</span>
                <span className="font-display text-2xl font-extrabold tabular-nums">{complete ? <Money value={estimate} /> : "—"}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-2">Estimation au prix du marché actuel. Le montant exact est fixé au moment du paiement.</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link href="/panier" onClick={() => setCartOpen(false)} className="rounded-xl border border-line py-3 text-center text-sm font-bold hover:bg-surface-2">
                  Voir le panier
                </Link>
                <Link href="/panier" onClick={() => setCartOpen(false)} className="rounded-xl bg-brand py-3 text-center text-sm font-bold text-on-brand">
                  Commander
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
