"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminOrder, getAdminOrders, type AdminOrder } from "@/lib/api";
import { formatFCFA } from "@/lib/format";
import { BackofficePage, btnGhost, downloadCsv, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const STATUS: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE_PAIEMENT: { label: "En attente de paiement", cls: "bg-surface-2 text-ink-2" },
  EN_VERIFICATION: { label: "Paiement à vérifier", cls: "bg-accent-soft text-ink" },
  PAYEE: { label: "Payée, à retirer", cls: "bg-brand-soft text-brand" },
  RETIREE: { label: "Retirée", cls: "bg-up/10 text-up" },
  ANNULEE: { label: "Annulée", cls: "bg-down/10 text-down" },
};

const METHOD: Record<string, string> = { MTN_MOMO: "MTN MoMo", MOOV_MONEY: "Moov Money" };

function Orders({ token }: StaffContext) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<(AdminOrder & { confirmedBy: { fullName: string } | null }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdminOrders(token, { status: status || undefined, q: q.trim() || undefined })
      .then((o) => {
        setOrders(o);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  function exportCsv() {
    if (!orders) return;
    downloadCsv("commandes-obp-market.csv", [
      ["Date", "Référence", "Client", "Téléphone", "Statut", "Montant (FCFA)", "Opérateur", "Réf. paiement", "Articles"],
      ...orders.map((o) => [
        new Date(o.createdAt).toLocaleString("fr-FR"),
        o.id.slice(-8).toUpperCase(),
        o.client.fullName,
        o.client.phone,
        STATUS[o.status]?.label ?? o.status,
        o.totalAmount,
        o.paymentMethod ? METHOD[o.paymentMethod] : "",
        o.paymentReference,
        o.items.map((i) => `${i.quantity} × ${i.product.name}`).join(" | "),
      ]),
    ]);
  }

  async function open(id: string) {
    try {
      setDetail(await getAdminOrder(token, id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commande introuvable.");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputCls} max-w-56`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <input className={`${inputCls} max-w-xs`} placeholder="Client, téléphone ou référence…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={exportCsv} disabled={!orders?.length} className={`${btnGhost} ml-auto`}>
          Exporter en CSV
        </button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}

      {!orders ? (
        <Empty>Chargement…</Empty>
      ) : orders.length === 0 ? (
        <Empty>Aucune commande.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Réf.</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer border-t border-line hover:bg-bg" onClick={() => open(o.id)}>
                  <td className="px-3 py-2 text-ink-2">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-3 py-2 font-mono text-xs">{o.id.slice(-8).toUpperCase()}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold">{o.client.fullName}</span>
                    <span className="ml-2 text-xs text-ink-2">{o.client.phone}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS[o.status]?.cls}`}>{STATUS[o.status]?.label ?? o.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatFCFA(o.totalAmount)} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Détail de la commande" onClick={() => setDetail(null)}>
          <div className="grid max-h-[85vh] w-full max-w-lg gap-4 overflow-y-auto rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-ink-2">Commande {detail.id.slice(-8).toUpperCase()}</p>
                <h2 className="font-display text-xl font-bold">{formatFCFA(detail.totalAmount)} F</h2>
              </div>
              <button type="button" aria-label="Fermer" className="text-2xl leading-none" onClick={() => setDetail(null)}>
                ×
              </button>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-2">Client</dt>
              <dd>
                {detail.client.fullName} · {detail.client.phone}
              </dd>
              <dt className="text-ink-2">Statut</dt>
              <dd>{STATUS[detail.status]?.label}</dd>
              <dt className="text-ink-2">Créée le</dt>
              <dd>{new Date(detail.createdAt).toLocaleString("fr-FR")}</dd>
              {detail.paidAt && (
                <>
                  <dt className="text-ink-2">Payée le</dt>
                  <dd>{new Date(detail.paidAt).toLocaleString("fr-FR")}</dd>
                </>
              )}
              <dt className="text-ink-2">Paiement</dt>
              <dd>
                {detail.paymentProvider === "NYOLE" ? "Nyole" : detail.paymentMethod ? `${METHOD[detail.paymentMethod]} · réf. ${detail.paymentReference ?? "—"}` : "—"}
              </dd>
              {detail.deliveryMode === "LIVRAISON" && (
                <>
                  <dt className="text-ink-2">Livraison</dt>
                  <dd>
                    {detail.deliveryZoneName} · {formatFCFA(detail.deliveryFee ?? 0)} F
                    <br />
                    {detail.deliveryAddress}
                    {detail.deliveryPhone ? ` · ${detail.deliveryPhone}` : ""}
                  </dd>
                </>
              )}
              {detail.confirmedBy && (
                <>
                  <dt className="text-ink-2">Confirmé par</dt>
                  <dd>{detail.confirmedBy.fullName}</dd>
                </>
              )}
              {detail.rejectionReason && (
                <>
                  <dt className="text-ink-2">Motif de rejet</dt>
                  <dd className="text-down">{detail.rejectionReason}</dd>
                </>
              )}
            </dl>
            <ul className="grid gap-1.5 rounded-xl border border-line bg-bg px-3 py-2 text-sm">
              {detail.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>
                    {i.quantity} × {i.product.name}
                    <span className="ml-2 text-xs text-ink-2">{i.fulfillment === "RETRAIT" ? (i.withdrawnAt ? "retiré" : "à retirer") : "dépôt"}</span>
                  </span>
                  <span className="font-mono">{formatFCFA(i.unitPrice * i.quantity)} F</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "ADMIN"]} title="Commandes" subtitle="Toutes les commandes, avec recherche, filtre par statut et export CSV pour Excel.">
      {(ctx) => <Orders {...ctx} />}
    </BackofficePage>
  );
}
