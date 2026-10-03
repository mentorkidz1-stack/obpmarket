"use client";

import { useCallback, useEffect, useState } from "react";
import { getCustomers, setCustomerDisabled, type CustomerRow } from "@/lib/api";
import { formatFCFA } from "@/lib/format";
import { BackofficePage, downloadCsv, btnGhost, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

function Customers({ token, user }: StaffContext) {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(() => {
    getCustomers(token, q.trim() || undefined)
      .then(setRows)
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function toggle(c: CustomerRow) {
    if (!c.disabled && !confirm(`Désactiver le compte de ${c.fullName} (${c.phone}) ? Il ne pourra plus se connecter.`)) return;
    try {
      await setCustomerDisabled(token, c.id, !c.disabled);
      setMsg({ kind: "ok", text: c.disabled ? "Compte réactivé." : "Compte désactivé." });
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Nom ou téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button
          type="button"
          disabled={!rows?.length}
          className={`${btnGhost} ml-auto`}
          onClick={() =>
            rows &&
            downloadCsv("clients-obp-market.csv", [
              ["Nom", "Téléphone", "Inscrit le", "Dernière connexion", "Commandes", "Total payé (FCFA)", "Actif"],
              ...rows.map((c) => [c.fullName, c.phone, new Date(c.createdAt).toLocaleDateString("fr-FR"), c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString("fr-FR") : "", c.ordersCount, c.totalSpent, c.disabled ? "non" : "oui"]),
            ])
          }
        >
          Exporter en CSV
        </button>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {!rows ? (
        <Empty>Chargement…</Empty>
      ) : rows.length === 0 ? (
        <Empty>Aucun client.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Inscrit le</th>
                <th className="px-3 py-2">Dernière visite</th>
                <th className="px-3 py-2 text-right">Commandes</th>
                <th className="px-3 py-2 text-right">Total payé</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={`border-t border-line ${c.disabled ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2">
                    <span className="font-semibold">{c.fullName}</span>
                    <span className="ml-2 text-xs text-ink-2">{c.phone}</span>
                    {c.disabled && <span className="ml-2 rounded-full bg-down/10 px-2 py-0.5 text-[10px] font-bold text-down">désactivé</span>}
                  </td>
                  <td className="px-3 py-2 text-ink-2">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-3 py-2 text-ink-2">{c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.ordersCount}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatFCFA(c.totalSpent)} F</td>
                  <td className="px-3 py-2 text-right">
                    {isAdmin && (
                      <button type="button" onClick={() => toggle(c)} className={`text-xs font-bold ${c.disabled ? "text-brand" : "text-down"}`}>
                        {c.disabled ? "Réactiver" : "Désactiver"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink-2">Liste limitée aux 300 clients les plus récents ; utilisez la recherche pour en retrouver un.</p>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "ADMIN"]} title="Clients" subtitle="Les comptes clients, leur activité et leurs achats payés.">
      {(ctx) => <Customers {...ctx} />}
    </BackofficePage>
  );
}
