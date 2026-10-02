"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  acceptLiquidityRequest,
  cancelResaleListing,
  createLiquidityRequest,
  createResaleListing,
  getMyLiquidityRequests,
  getMyResaleListings,
  getMyStock,
  rejectLiquidityRequest,
  type LiquidityRequestRecord,
  type ResaleListingRecord,
  type StockHolding,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money, useMoneyText } from "@/components/money";
import { ProductImage } from "@/components/product-image";

const REQUEST_STATUS_LABEL: Record<LiquidityRequestRecord["status"], string> = {
  EN_ATTENTE: "Demande envoyée, en attente d'une offre",
  OFFRE_ENVOYEE: "Offre reçue d'OBP",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

type OpenAction = { productId: string; kind: "liquidity" | "resale" } | null;

export default function MyStockPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const moneyText = useMoneyText();
  const [holdings, setHoldings] = useState<StockHolding[] | null>(null);
  const [requests, setRequests] = useState<LiquidityRequestRecord[] | null>(null);
  const [listings, setListings] = useState<ResaleListingRecord[] | null>(null);
  const [openAction, setOpenAction] = useState<OpenAction>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    Promise.all([getMyStock(t), getMyLiquidityRequests(t), getMyResaleListings(t)]).then(([h, r, l]) => {
      setHoldings(h);
      setRequests(r);
      setListings(l);
    });
  }

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    reload(token);
  }, [ready, token, router]);

  async function submitAction(productId: string) {
    if (!token || !openAction) return;
    setBusy(true);
    setError(null);
    try {
      if (openAction.kind === "liquidity") await createLiquidityRequest(token, productId, qty);
      else await createResaleListing(token, productId, qty);
      setOpenAction(null);
      setQty(1);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la demande.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, action: "accept" | "reject") {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "accept") await acceptLiquidityRequest(token, id);
      else await rejectLiquidityRequest(token, id);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelListing(id: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await cancelResaleListing(token, id);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'annulation.");
    } finally {
      setBusy(false);
    }
  }

  if (!holdings || !requests || !listings) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
  const totalGain = holdings.reduce((sum, h) => sum + (h.gain ?? 0), 0);
  const offersToDecide = requests.filter((r) => r.status === "OFFRE_ENVOYEE");
  const activeListings = listings.filter((l) => l.status === "EN_VENTE");

  return (
    <>
    <PageHero title="Mon stock" crumb="Mon stock" subtitle="Vos produits déposés chez OBP, valorisés au prix du marché d'aujourd'hui." />
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-brand p-6 text-on-brand">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Valeur de mon stock</p>
        <p className="font-display text-4xl font-extrabold tabular-nums"><Money value={totalValue} /></p>
        {totalGain !== 0 && (
          <span className="mt-1 inline-block rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-brand">
            {totalGain >= 0 ? "+" : ""}
            {moneyText(totalGain)} depuis l&apos;achat
          </span>
        )}
      </div>

      {offersToDecide.length > 0 && (
        <div className="mt-4 grid gap-3">
          {offersToDecide.map((r) => (
            <div key={r.id} className="rounded-2xl bg-brand p-4 text-on-brand">
              <p className="text-xs uppercase tracking-wide opacity-80">Offre de rachat d&apos;OBP Market</p>
              <p className="font-display text-2xl font-bold">
                <Money value={r.offeredUnitPrice! * r.quantity} />
              </p>
              <p className="text-xs opacity-90">
                {r.product.name} · {r.quantity} {r.product.unitLabel} à {moneyText(r.offeredUnitPrice!)}
              </p>
              {r.expiresAt && (
                <p className="mt-1 text-xs opacity-80">Valable jusqu&apos;au {new Date(r.expiresAt).toLocaleString("fr-FR")}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide(r.id, "accept")}
                  className="flex-1 rounded-xl bg-on-brand py-2.5 text-sm font-semibold text-brand disabled:opacity-60"
                >
                  Accepter · être payé
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide(r.id, "reject")}
                  className="rounded-xl border border-on-brand/50 px-4 py-2.5 text-sm font-semibold"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      {holdings.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
          Rien en dépôt pour l&apos;instant. Choisissez « Je laisse en dépôt » à l&apos;achat d&apos;un produit
          stockable.
        </p>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
          {holdings.map((h) => {
            const available = h.quantity - h.reservedQuantity;
            const pendingLiquidity = requests.find(
              (r) => r.productId === h.productId && (r.status === "EN_ATTENTE" || r.status === "OFFRE_ENVOYEE"),
            );
            const activeForThis = activeListings.filter((l) => l.productId === h.productId);
            const isOpen = openAction?.productId === h.productId;

            return (
              <li key={h.id} className="border-t border-line p-4 first:border-t-0">
                <div className="flex items-center gap-3">
                  <ProductImage product={h.product} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold">{h.product.name}</p>
                    <p className="text-xs text-ink-2">
                      {h.quantity} {h.product.unitLabel} · acheté {moneyText(h.avgUnitCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold tabular-nums">
                      {h.currentValue != null ? moneyText(h.currentValue) : "—"}
                    </p>
                    {h.gain != null && (
                      <p className={`text-xs font-mono ${h.gain >= 0 ? "text-up" : "text-down"}`}>
                        {h.gain >= 0 ? "+" : ""}
                        {moneyText(h.gain)}
                      </p>
                    )}
                  </div>
                </div>

                {activeForThis.map((l) => (
                  <div key={l.id} className="mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs">
                    <span>
                      {l.quantity} {h.product.unitLabel} en revente · vendu au prix du marché au moment de la vente
                    </span>
                    <button type="button" onClick={() => cancelListing(l.id)} disabled={busy} className="font-semibold text-down underline">
                      Annuler
                    </button>
                  </div>
                ))}

                {pendingLiquidity && (
                  <p className="mt-2 text-xs text-ink-2">
                    {pendingLiquidity.quantity} {h.product.unitLabel.split(" ")[0]}
                    {pendingLiquidity.quantity > 1 ? "s" : ""} bloqué{pendingLiquidity.quantity > 1 ? "s" : ""} ·{" "}
                    {REQUEST_STATUS_LABEL[pendingLiquidity.status]}
                  </p>
                )}

                {isOpen ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-line">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 py-1.5 font-bold">
                        −
                      </button>
                      <span className="min-w-8 text-center font-mono text-sm">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => Math.min(available, q + 1))} className="px-2.5 py-1.5 font-bold">
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => submitAction(h.productId)}
                      className="flex-1 rounded-xl bg-brand py-2 text-sm font-semibold text-on-brand disabled:opacity-60"
                    >
                      {openAction.kind === "liquidity" ? "Demander une offre" : "Mettre en vente"}
                    </button>
                    <button type="button" onClick={() => setOpenAction(null)} className="text-xs text-ink-2 underline">
                      Annuler
                    </button>
                  </div>
                ) : (
                  available > 0 &&
                  !pendingLiquidity && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenAction({ productId: h.productId, kind: "resale" });
                          setQty(1);
                        }}
                        className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
                      >
                        Mettre en revente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenAction({ productId: h.productId, kind: "liquidity" });
                          setQty(1);
                        }}
                        className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
                      >
                        Vente en liquidité
                      </button>
                    </div>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}

      {requests.filter((r) => r.status === "ACCEPTEE" || r.status === "REFUSEE").length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Historique des demandes</h2>
          <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
            {requests
              .filter((r) => r.status === "ACCEPTEE" || r.status === "REFUSEE")
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm first:border-t-0">
                  <span>
                    {r.product.name} · {r.quantity} {r.product.unitLabel}
                  </span>
                  <span className={r.status === "ACCEPTEE" ? "text-up" : "text-ink-2"}>
                    {REQUEST_STATUS_LABEL[r.status]} · {formatRelativeTime(r.decidedAt ?? r.createdAt)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </main>
    </>
  );
}
