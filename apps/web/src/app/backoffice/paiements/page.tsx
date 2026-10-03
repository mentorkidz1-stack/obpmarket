"use client";

import { useEffect, useState } from "react";
import { confirmPayment, getPaymentQueue, rejectPayment, type Order } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

const METHOD_LABEL: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  MOOV_MONEY: "Moov Money",
};

export default function PaymentQueuePage() {
  const { user, token, authorized, logout } = useStaffSession(["GESTIONNAIRE_LIQUIDITE", "ADMIN"]);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    getPaymentQueue(t).then((list) => {
      setOrders(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    });
  }

  useEffect(() => {
    if (token) reload(token);
  }, [token]);

  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  async function handle(action: "confirm" | "reject") {
    if (!selected || !token) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "confirm") await confirmPayment(token, selected.id);
      else await rejectPayment(token, selected.id, reason || undefined);
      setReason("");
      setSelectedId(null);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized || !user || !orders) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold">Paiements à vérifier</h1>
          <p className="text-sm text-ink-2">
            Aucune passerelle branchée : ouvrez votre appli Mobile Money marchande, retrouvez la transaction
            correspondant à la référence indiquée, puis confirmez ou rejetez.
          </p>
        </header>

        {orders.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
            Aucun paiement en attente de vérification.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[300px_1fr]">
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {orders.map((o) => (
                <li key={o.id} className="border-t border-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => { setSelectedId(o.id); setReason(""); setError(null); }}
                    className={`grid w-full gap-0.5 px-3 py-3 text-left text-sm ${o.id === selectedId ? "bg-brand-soft" : ""}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-display font-bold">{o.client?.fullName ?? o.client?.phone}</span>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-ink">
                        {o.paymentMethod ? METHOD_LABEL[o.paymentMethod] : "—"}
                      </span>
                    </span>
                    <span className="text-xs text-ink-2">{formatFCFA(o.totalAmount)} F</span>
                    <span className="text-xs text-ink-2">
                      {o.paymentSubmittedAt ? formatRelativeTime(o.paymentSubmittedAt) : formatRelativeTime(o.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {selected && (
              <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-2">
                    Commande de {selected.client?.fullName ?? selected.client?.phone}
                  </p>
                  <h2 className="font-display text-xl font-bold">{formatFCFA(selected.totalAmount)} F</h2>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-ink-2">Opérateur</dt>
                  <dd>{selected.paymentMethod ? METHOD_LABEL[selected.paymentMethod] : "—"}</dd>
                  <dt className="text-ink-2">Référence indiquée</dt>
                  <dd className="font-mono">{selected.paymentReference ?? "—"}</dd>
                  <dt className="text-ink-2">Déclaré</dt>
                  <dd>{selected.paymentSubmittedAt ? new Date(selected.paymentSubmittedAt).toLocaleString("fr-FR") : "—"}</dd>
                </dl>

                <ul className="grid gap-1.5 rounded-xl border border-line bg-bg px-3 py-2 text-sm">
                  {selected.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>{item.quantity} × {item.product.name}</span>
                      <span className="tabular-nums">{formatFCFA(item.unitPrice * item.quantity)} F</span>
                    </li>
                  ))}
                </ul>

                <div className="grid gap-1.5">
                  <label htmlFor="reason" className="text-xs font-semibold text-ink-2">
                    Motif de rejet (si vous ne retrouvez pas le dépôt)
                  </label>
                  <textarea
                    id="reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>

                {error && <p className="text-sm text-down">{error}</p>}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handle("reject")}
                    className="rounded-xl border border-down px-4 py-2.5 text-sm font-semibold text-down disabled:opacity-60"
                  >
                    Rejeter · stock remis en vente
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handle("confirm")}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
                  >
                    Confirmer · dépôt retrouvé
                  </button>
                </div>
                <p className="text-[11px] text-ink-2">Consigné au journal : {user.fullName}, l&apos;heure et votre décision.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
