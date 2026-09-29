"use client";

import { useEffect, useState } from "react";
import { approveReading, getReadingsToReview, rejectReading, type PriceReadingToReview } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

export default function ReviewQueuePage() {
  const { user, token, authorized, logout } = useStaffSession(["GESTIONNAIRE_PRIX", "ADMIN"]);
  const [readings, setReadings] = useState<PriceReadingToReview[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getReadingsToReview(token)
      .then((list) => {
        setReadings(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, [token]);

  const selected = readings?.find((r) => r.id === selectedId) ?? null;

  async function handle(action: "approve" | "reject") {
    if (!selected || !token) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "approve") {
        await approveReading(token, selected.id, note || undefined);
      } else {
        await rejectReading(token, selected.id, note || undefined);
      }
      setReadings((prev) => {
        const next = (prev ?? []).filter((r) => r.id !== selected.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized || !user) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <StaffBar user={user} logout={logout} />
      {error && !readings ? (
        <main className="flex flex-1 items-center justify-center p-8 text-sm text-ink-2">{error}</main>
      ) : !readings ? (
        <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>
      ) : (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-bold">Relevés à contrôler</h1>
            <p className="text-sm text-ink-2">
              {readings.length} relevé{readings.length > 1 ? "s" : ""} mis de côté par le contrôle anti-fraude (PRI-02).
              Rien n&apos;est rejeté automatiquement : c&apos;est vous qui tranchez.
            </p>
          </header>

          {readings.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
              Aucun relevé en attente de contrôle pour le moment.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-[280px_1fr]">
              <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
                {readings.map((r) => (
                  <li key={r.id} className="border-t border-line first:border-t-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`grid w-full gap-0.5 px-3 py-3 text-left text-sm ${
                        r.id === selectedId ? "bg-brand-soft" : "bg-transparent"
                      }`}
                    >
                      <span className="font-display font-bold">{r.product.name}</span>
                      <span className="text-xs text-ink-2">
                        {r.market.name} · {r.agent.fullName}
                      </span>
                      <span className="text-xs text-ink-2">{formatRelativeTime(r.recordedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {selected && (
                <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-2">Relevé sélectionné</p>
                      <h2 className="font-display text-xl font-bold">
                        {selected.product.name} · {selected.market.name}
                      </h2>
                    </div>
                    <p className="font-display text-2xl font-bold tabular-nums">{formatFCFA(selected.price)} F</p>
                  </div>

                  <div className="rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
                    {selected.flagReason}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-ink-2">Agent</dt>
                    <dd>{selected.agent.fullName}</dd>
                    <dt className="text-ink-2">Qualité</dt>
                    <dd>{selected.quality ?? "—"}</dd>
                    <dt className="text-ink-2">Relevé à</dt>
                    <dd>{new Date(selected.recordedAt).toLocaleString("fr-FR")}</dd>
                    <dt className="text-ink-2">Position</dt>
                    <dd>
                      {selected.latitude != null
                        ? `${selected.distanceToMarketMeters ? Math.round(selected.distanceToMarketMeters) + " m du centre" : "reçue"}`
                        : "non fournie"}
                    </dd>
                  </dl>

                  <div className="grid gap-1.5">
                    <label htmlFor="note" className="text-xs font-semibold text-ink-2">
                      Note pour le journal (facultatif)
                    </label>
                    <textarea
                      id="note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
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
                      Rejeter
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handle("approve")}
                      className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
                    >
                      Valider quand même
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-2">
                    Consigné au journal d&apos;audit : {user.fullName}, l&apos;heure et votre décision (BO-10).
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </>
  );
}
