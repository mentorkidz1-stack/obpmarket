"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { createOrder } from "@/lib/api";
import { formatFCFA } from "@/lib/format";
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-block pb-4 text-sm text-ink-2">
        ← Continuer mes achats
      </Link>
      <h1 className="font-display text-2xl font-bold">Mon panier</h1>

      {lines.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
          Votre panier est vide. <Link href="/" className="font-semibold text-brand underline">Voir les prix du jour</Link>
        </p>
      ) : (
        <>
          <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
            {lines.map((line) => {
              return (
                <li key={line.product.id} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                  <ProductImage product={line.product} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-bold">{line.product.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-2">
                      <span>{line.product.unitLabel}</span>
                      {line.fulfillment === "DEPOT" && (
                        <span className="rounded border border-brand px-1 py-px font-mono text-[10px] text-brand">
                          Dépôt
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center rounded-xl border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                      className="px-2.5 py-1.5 text-base font-bold"
                      aria-label={`Diminuer la quantité de ${line.product.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center font-mono text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                      disabled={line.quantity >= line.product.stockQuantity}
                      className="px-2.5 py-1.5 text-base font-bold disabled:opacity-40"
                      aria-label={`Augmenter la quantité de ${line.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.product.id)}
                    className="text-xs text-down underline"
                  >
                    Retirer
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between text-sm text-ink-2">
              <span>Articles</span>
              <span>{total}</span>
            </div>
            <p className="mt-1 text-xs text-ink-2">
              Le total exact est calculé au prix du marché au moment du paiement.
            </p>
          </div>

          {!user && (
            <p className="mt-3 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-xs">
              Connectez-vous pour passer commande.
            </p>
          )}
          {error && <p className="mt-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={handleCheckout}
            className="mt-4 w-full rounded-xl bg-brand py-3.5 text-center font-semibold text-on-brand disabled:opacity-60"
          >
            {busy ? "Validation…" : user ? "Commander · payer par Mobile Money" : "Se connecter pour commander"}
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-2">
            Paiement sécurisé par MTN MoMo ou Moov Money. Les instructions de paiement s&apos;affichent à l&apos;étape
            suivante.
          </p>
        </>
      )}
    </main>
  );
}
