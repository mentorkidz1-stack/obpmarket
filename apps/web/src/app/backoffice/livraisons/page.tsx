"use client";

import { useCallback, useEffect, useState } from "react";
import { confirmDelivery, getDeliveries, setDeliveryStatus, type DeliveryOrder, type DeliveryStatus } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const STEP: Record<DeliveryStatus, { label: string; tone: string }> = {
  A_PREPARER: { label: "À préparer", tone: "bg-accent-soft text-ink" },
  PREPAREE: { label: "Préparée", tone: "bg-brand-soft text-brand" },
  EN_ROUTE: { label: "En route", tone: "bg-brand text-on-brand" },
  LIVREE: { label: "Livrée", tone: "bg-up/10 text-up" },
};

function Deliveries({ token, user }: StaffContext) {
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [rows, setRows] = useState<DeliveryOrder[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(() => {
    getDeliveries(token, tab === "done")
      .then(setRows)
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token, tab]);
  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await action();
      setMsg({ kind: "ok", text: ok });
      setConfirming(null);
      setCode("");
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="flex gap-1 self-start rounded-xl bg-surface-2 p-1">
        {(
          [
            ["todo", "À livrer"],
            ["done", "Livrées"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" onClick={() => { setRows(null); setTab(v); }} className={`rounded-lg px-4 py-1.5 text-sm font-bold ${tab === v ? "bg-surface shadow-sm" : "text-ink-2"}`}>
            {l}
          </button>
        ))}
      </div>

      {!rows ? (
        <Empty>Chargement…</Empty>
      ) : rows.length === 0 ? (
        <Empty>{tab === "todo" ? "Aucune livraison en attente." : "Aucune livraison terminée."}</Empty>
      ) : (
        <ul className="grid gap-3">
          {rows.map((o) => {
            const status = o.deliveryStatus ?? "A_PREPARER";
            return (
              <li key={o.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">
                      {o.client.fullName !== "Nouveau client" ? o.client.fullName : o.client.phone}
                      <span className="ml-2 font-mono text-xs font-normal text-ink-2">#{o.id.slice(-8).toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-ink-2">
                      {o.paidAt ? `Payée ${formatRelativeTime(o.paidAt)}` : ""}
                      {o.deliveredAt ? ` · livrée ${formatRelativeTime(o.deliveredAt)}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STEP[status].tone}`}>{STEP[status].label}</span>
                </div>

                <div className="grid gap-1 rounded-xl bg-bg px-3 py-2.5 text-sm">
                  <p className="font-semibold">{o.deliveryAddress}</p>
                  <p className="text-xs text-ink-2">
                    Zone {o.deliveryZoneName} · frais {formatFCFA(o.deliveryFee)} F{o.depot ? ` · départ ${o.depot.name} (${o.depot.city})` : ""}
                  </p>
                  {o.deliveryPhone && (
                    <a href={`tel:${o.deliveryPhone}`} className="w-fit text-sm font-bold text-brand">
                      Appeler le {o.deliveryPhone}
                    </a>
                  )}
                  {o.deliveryNote && <p className="text-xs text-ink-2">Consigne : {o.deliveryNote}</p>}
                </div>

                <ul className="text-sm text-ink-2">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      {i.quantity} × {i.product.name} <span className="text-xs">({i.product.unitLabel})</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm">
                  Montant de la commande : <strong>{formatFCFA(o.totalAmount)} F</strong> <span className="text-xs text-ink-2">(déjà payé)</span>
                </p>

                {tab === "todo" &&
                  (confirming === o.id ? (
                    <div className="grid gap-2 sm:max-w-sm">
                      <label className="grid gap-1 text-xs font-semibold text-ink-2">
                        Code de livraison donné par le client (6 chiffres){isAdmin ? ", ou vide sans code" : ""}
                        <input
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                          className={`${inputCls} text-center font-mono text-xl tracking-[0.3em]`}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button type="button" disabled={busy || (code.length !== 6 && !(isAdmin && code === ""))} onClick={() => run(() => confirmDelivery(token, o.id, code || undefined), "Livraison confirmée : le client est prévenu.")} className={btnPrimary}>
                          Confirmer la remise
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className={btnGhost}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {status === "A_PREPARER" && (
                        <button type="button" disabled={busy} onClick={() => run(() => setDeliveryStatus(token, o.id, "PREPAREE"), "Commande marquée comme préparée.")} className={btnPrimary}>
                          Commande préparée
                        </button>
                      )}
                      {(status === "A_PREPARER" || status === "PREPAREE") && (
                        <button type="button" disabled={busy} onClick={() => run(() => setDeliveryStatus(token, o.id, "EN_ROUTE"), "Livraison en route : le client est prévenu.")} className={status === "PREPAREE" ? btnPrimary : btnGhost}>
                          Partie en livraison
                        </button>
                      )}
                      {status === "EN_ROUTE" && (
                        <button type="button" disabled={busy} onClick={() => { setConfirming(o.id); setCode(""); }} className={btnPrimary}>
                          Remise au client…
                        </button>
                      )}
                    </div>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-ink-2">Chaque étape prévient le client et est consignée au journal d&apos;activité. La remise se confirme avec le code à 6 chiffres que le client reçoit après son paiement.</p>
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "AGENT_MAGASIN", "ADMIN"]} title="Livraisons à domicile" subtitle="Les commandes payées à livrer : préparez, lancez la livraison, puis confirmez la remise avec le code du client." width="max-w-4xl">
      {(ctx) => <Deliveries {...ctx} />}
    </BackofficePage>
  );
}
