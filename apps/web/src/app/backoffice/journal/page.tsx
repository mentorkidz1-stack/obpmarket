"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuditLog, type AuditEntry } from "@/lib/api";
import { BackofficePage, btnGhost, downloadCsv, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const PAGE = 100;

function Journal({ token }: StaffContext) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [action, setAction] = useState("");
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAuditLog(token, { action: action.trim() || undefined, skip })
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, action, skip]);

  useEffect(() => {
    const t = setTimeout(load, action ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, action]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Filtrer par action (ex. Stock, Paiement…)"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setSkip(0);
          }}
        />
        <button
          type="button"
          disabled={!rows?.length}
          className={`${btnGhost} ml-auto`}
          onClick={() =>
            rows &&
            downloadCsv("journal-obp-market.csv", [["Date", "Qui", "Action", "Cible", "Détail"], ...rows.map((r) => [new Date(r.createdAt).toLocaleString("fr-FR"), r.actorName, r.action, r.target, r.detail])])
          }
        >
          Exporter la page en CSV
        </button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {!rows ? (
        <Empty>Chargement…</Empty>
      ) : rows.length === 0 ? (
        <Empty>Aucune entrée.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Qui</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Cible</th>
                <th className="px-3 py-2">Détail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-2">{new Date(r.createdAt).toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 font-semibold">{r.actorName}</td>
                  <td className="px-3 py-2">{r.action}</td>
                  <td className="px-3 py-2 text-ink-2">{r.target}</td>
                  <td className="px-3 py-2 text-xs text-ink-2">{r.detail ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <button type="button" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))} className={btnGhost}>
          ← Plus récent
        </button>
        <button type="button" disabled={!rows || rows.length < PAGE} onClick={() => setSkip(skip + PAGE)} className={btnGhost}>
          Plus ancien →
        </button>
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <BackofficePage roles={["ADMIN"]} title="Journal d'activité" subtitle="Qui a fait quoi : paiements, stock, prix, comptes, validations. Les entrées ne peuvent être ni modifiées ni supprimées.">
      {(ctx) => <Journal {...ctx} />}
    </BackofficePage>
  );
}
