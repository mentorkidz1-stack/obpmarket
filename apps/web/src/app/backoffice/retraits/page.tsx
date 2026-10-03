"use client";

import { useCallback, useEffect, useState } from "react";
import { getPayouts, markPayoutPaid, rejectPayout, type PayoutRecord } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { BackofficePage, btnGhost, btnPrimary, downloadCsv, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const METHOD: Record<string, string> = { MTN_MOMO: "MTN MoMo", MOOV_MONEY: "Moov Money" };
const STATUS = {
  EN_ATTENTE: { label: "À verser", tone: "bg-accent-soft text-ink" },
  PAYE: { label: "Versé", tone: "bg-up/10 text-up" },
  REFUSE: { label: "Refusé", tone: "bg-down/10 text-down" },
} as const;

function Payouts({ token }: StaffContext) {
  const [rows, setRows] = useState<PayoutRecord[] | null>(null);
  const [tab, setTab] = useState<"EN_ATTENTE" | "TOUS">("EN_ATTENTE");
  const [active, setActive] = useState<{ id: string; mode: "pay" | "reject" } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    getPayouts(token)
      .then(setRows)
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token]);
  useEffect(load, [load]);

  async function submit(p: PayoutRecord) {
    if (!active) return;
    setBusy(true);
    setMsg(null);
    try {
      if (active.mode === "pay") await markPayoutPaid(token, p.id, text);
      else await rejectPayout(token, p.id, text);
      setMsg({ kind: "ok", text: active.mode === "pay" ? "Retrait marqué comme versé : le vendeur est prévenu." : "Retrait refusé : le montant est recrédité au vendeur." });
      setActive(null);
      setText("");
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
    } finally {
      setBusy(false);
    }
  }

  const shown = (rows ?? []).filter((r) => tab === "TOUS" || r.status === "EN_ATTENTE");
  const pendingTotal = (rows ?? []).filter((r) => r.status === "EN_ATTENTE").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="grid gap-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          {(
            [
              ["EN_ATTENTE", "À verser"],
              ["TOUS", "Historique"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setTab(v)} className={`rounded-lg px-4 py-1.5 text-sm font-bold ${tab === v ? "bg-surface shadow-sm" : "text-ink-2"}`}>
              {l}
            </button>
          ))}
        </div>
        {pendingTotal > 0 && <span className="text-sm text-ink-2">Total à verser : <strong className="text-ink">{formatFCFA(pendingTotal)} F</strong></span>}
        <button
          type="button"
          disabled={!rows?.length}
          className={`${btnGhost} ml-auto`}
          onClick={() =>
            rows &&
            downloadCsv("retraits-obp-market.csv", [
              ["Date", "Vendeur", "Téléphone du compte", "Montant (FCFA)", "Opérateur", "Numéro à créditer", "Statut", "Référence", "Motif de refus"],
              ...rows.map((r) => [new Date(r.createdAt).toLocaleString("fr-FR"), r.owner?.fullName, r.owner?.phone, r.amount, METHOD[r.method], r.phone, STATUS[r.status].label, r.reference, r.rejectionReason]),
            ])
          }
        >
          Exporter en CSV
        </button>
      </div>

      {!rows ? (
        <Empty>Chargement…</Empty>
      ) : shown.length === 0 ? (
        <Empty>{tab === "EN_ATTENTE" ? "Aucun retrait à verser pour l'instant." : "Aucune demande de retrait."}</Empty>
      ) : (
        <ul className="grid gap-3">
          {shown.map((p) => (
            <li key={p.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold">{formatFCFA(p.amount)} F</p>
                  <p className="text-sm text-ink-2">
                    {p.owner?.fullName} · {p.owner?.phone} · {formatRelativeTime(p.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span>
              </div>
              <p className="rounded-xl bg-bg px-3 py-2 text-sm">
                À envoyer par <strong>{METHOD[p.method]}</strong> au <strong className="select-all font-mono">{p.phone}</strong>
              </p>
              {p.status === "PAYE" && (
                <p className="text-xs text-ink-2">
                  Versé par {p.processedBy?.fullName ?? "—"} · réf. {p.reference}
                </p>
              )}
              {p.status === "REFUSE" && <p className="text-xs text-down">Refusé : {p.rejectionReason}</p>}

              {p.status === "EN_ATTENTE" &&
                (active?.id === p.id ? (
                  <div className="grid gap-2">
                    <label className="grid gap-1 text-xs font-semibold text-ink-2">
                      {active.mode === "pay" ? "Référence de la transaction Mobile Money" : "Motif du refus (le vendeur le verra)"}
                      <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
                    </label>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy || text.trim().length < 3} onClick={() => submit(p)} className={active.mode === "pay" ? btnPrimary : "rounded-xl bg-down px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"}>
                        {active.mode === "pay" ? "Confirmer le versement" : "Refuser et recréditer"}
                      </button>
                      <button type="button" onClick={() => setActive(null)} className={btnGhost}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setActive({ id: p.id, mode: "pay" }); setText(""); }} className={btnPrimary}>
                      J&apos;ai versé les fonds
                    </button>
                    <button type="button" onClick={() => { setActive({ id: p.id, mode: "reject" }); setText(""); }} className={btnGhost}>
                      Refuser
                    </button>
                  </div>
                ))}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-2">Le montant est retenu sur le portefeuille dès la demande. Envoyez l&apos;argent depuis votre compte Mobile Money marchand, puis confirmez ici avec la référence : l&apos;opération est consignée au journal d&apos;activité.</p>
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "ADMIN"]} title="Retraits à verser" subtitle="Les demandes de retrait des vendeurs et revendeurs : versez les fonds, puis confirmez." width="max-w-4xl">
      {(ctx) => <Payouts {...ctx} />}
    </BackofficePage>
  );
}
