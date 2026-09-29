"use client";

import { useEffect, useState } from "react";
import {
  getLatestReferencePrices,
  getPendingLiquidityRequests,
  offerLiquidity,
  type LiquidityRequestRecord,
  type ReferencePrice,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

export default function LiquidityQueuePage() {
  const { user, token, authorized, logout } = useStaffSession(["GESTIONNAIRE_LIQUIDITE", "ADMIN"]);
  const [requests, setRequests] = useState<LiquidityRequestRecord[] | null>(null);
  const [prices, setPrices] = useState<Map<string, ReferencePrice> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unitPrice, setUnitPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPendingLiquidityRequests(token), getLatestReferencePrices()]).then(([reqs, refs]) => {
      setRequests(reqs);
      setPrices(new Map(refs.map((r) => [r.productId, r])));
      const first = reqs.find((r) => r.status === "EN_ATTENTE") ?? reqs[0];
      setSelectedId(first?.id ?? null);
      const ref = first ? refs.find((r) => r.productId === first.productId) : undefined;
      if (ref) setUnitPrice(String(Math.round(ref.value)));
    });
  }, [token]);

  const selected = requests?.find((r) => r.id === selectedId) ?? null;
  const reference = selected && prices ? prices.get(selected.productId) : undefined;

  function selectRequest(r: LiquidityRequestRecord) {
    setSelectedId(r.id);
    const ref = prices?.get(r.productId);
    setUnitPrice(ref ? String(Math.round(ref.value)) : "");
  }

  async function handleOffer() {
    if (!selected || !token) return;
    const price = Number(unitPrice);
    if (!price || price <= 0) {
      setError("Entrez un prix valide.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await offerLiquidity(token, selected.id, price);
      setRequests((prev) => {
        const next = (prev ?? []).map((r) =>
          r.id === selected.id ? { ...r, status: "OFFRE_ENVOYEE" as const, offeredUnitPrice: price } : r,
        );
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized || !user || !requests || !prices) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const pending = requests.filter((r) => r.status === "EN_ATTENTE" || r.status === "OFFRE_ENVOYEE");

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold">Demandes de liquidité</h1>
          <p className="text-sm text-ink-2">
            Vous fixez le prix de chaque offre. Elle est valable 24 h puis expire d&apos;elle-même.
          </p>
        </header>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
            Aucune demande en attente pour le moment.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[300px_1fr]">
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {pending.map((r) => (
                <li key={r.id} className="border-t border-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => selectRequest(r)}
                    className={`grid w-full gap-0.5 px-3 py-3 text-left text-sm ${r.id === selectedId ? "bg-brand-soft" : ""}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-display font-bold">{r.client?.fullName ?? r.client?.phone}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "EN_ATTENTE" ? "bg-accent-soft text-ink" : "bg-surface-2 text-ink-2"
                        }`}
                      >
                        {r.status === "EN_ATTENTE" ? "Nouvelle" : "Offre envoyée"}
                      </span>
                    </span>
                    <span className="text-xs text-ink-2">
                      {r.product.name} · {r.quantity} {r.product.unitLabel}
                    </span>
                    <span className="text-xs text-ink-2">{formatRelativeTime(r.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {selected && (
              <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-2">
                      Demande de {selected.client?.fullName ?? selected.client?.phone}
                    </p>
                    <h2 className="font-display text-xl font-bold">
                      {selected.product.name} · {selected.quantity} {selected.product.unitLabel}
                    </h2>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-ink-2">Prix du marché</dt>
                  <dd>{reference ? `${formatFCFA(reference.value)} F` : "—"}</dd>
                </dl>

                <div className="grid gap-2">
                  <label htmlFor="unitPrice" className="text-xs font-semibold text-ink-2">
                    Prix proposé par unité
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-brand px-3 py-2">
                    <input
                      id="unitPrice"
                      inputMode="numeric"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-transparent font-display text-2xl font-bold tabular-nums outline-none"
                    />
                    <span className="text-sm font-semibold text-ink-2">F</span>
                  </div>
                  {reference && unitPrice && (
                    <p className="text-xs text-ink-2">
                      Total à payer : {formatFCFA(Number(unitPrice) * selected.quantity)} F · écart avec le marché{" "}
                      {(((Number(unitPrice) - reference.value) / reference.value) * 100).toFixed(1)} %
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-down">{error}</p>}

                <button
                  type="button"
                  disabled={busy || selected.status === "OFFRE_ENVOYEE"}
                  onClick={handleOffer}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
                >
                  {selected.status === "OFFRE_ENVOYEE" ? "Offre déjà envoyée · valable 24 h" : busy ? "Envoi…" : "Envoyer l'offre · valable 24 h"}
                </button>
                <p className="text-[11px] text-ink-2">
                  Consigné au journal : {user.fullName}, l&apos;heure et le prix proposé.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
