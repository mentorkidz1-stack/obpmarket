"use client";

import { useEffect, useState } from "react";
import {
  approveVendor,
  approveVendorListing,
  getAllVendors,
  getPendingVendorListings,
  getPendingVendors,
  markVendorListingReceived,
  reactivateVendor,
  rejectVendor,
  rejectVendorListing,
  requestVendorListingCorrection,
  suspendVendor,
  type VendorListingRecord,
  type VendorProfileRecord,
  type VendorStatus,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

const TYPE_LABEL = { PARTICULIER: "Particulier", PROFESSIONNEL: "Professionnel", COOPERATIVE: "Coopérative" } as const;

const STATUS_STYLE: Record<VendorStatus, { label: string; tone: string }> = {
  EN_ATTENTE: { label: "À valider", tone: "bg-accent-soft text-accent" },
  ACTIF: { label: "Actif", tone: "bg-up/10 text-up" },
  SUSPENDU: { label: "Suspendu", tone: "bg-down/10 text-down" },
  REFUSE: { label: "Refusé", tone: "bg-surface-2 text-ink-2" },
};

type VendorRow = VendorProfileRecord & { _count: { listings: number } };

const field = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";

export default function VendorModerationPage() {
  const { user, token, authorized, logout } = useStaffSession(["MODERATEUR", "ADMIN"]);
  const [tab, setTab] = useState<"traiter" | "vendeurs">("traiter");
  const [pendingVendors, setPendingVendors] = useState<VendorProfileRecord[] | null>(null);
  const [allVendors, setAllVendors] = useState<VendorRow[] | null>(null);
  const [listings, setListings] = useState<VendorListingRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [received, setReceived] = useState("");
  const [vendorReason, setVendorReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    Promise.all([getPendingVendors(t), getPendingVendorListings(t), getAllVendors(t)])
      .then(([v, l, all]) => {
        setPendingVendors(v);
        setListings(l);
        setAllVendors(all);
        setSelectedId((prev) => (prev && l.some((x) => x.id === prev) ? prev : (l.find((x) => x.status === "EN_ATTENTE")?.id ?? l[0]?.id ?? null)));
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    if (token) reload(token);
  }, [token]);

  const selected = listings?.find((l) => l.id === selectedId) ?? null;
  const selectedPhotos: string[] = (() => {
    try {
      return selected ? JSON.parse(selected.photos || "[]") : [];
    } catch {
      return [];
    }
  })();

  async function run(action: () => Promise<unknown>) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setReason("");
      setReceived("");
      setPhotoIndex(0);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  function listingDecision(action: "approve" | "correction" | "reject" | "receive") {
    if (!selected || !token) return;
    if ((action === "correction" || action === "reject") && !reason.trim()) {
      setError("Un motif est nécessaire.");
      return;
    }
    const qty = received.trim() ? Number(received) : undefined;
    return run(() => {
      if (action === "approve") return approveVendorListing(token, selected.id);
      if (action === "correction") return requestVendorListingCorrection(token, selected.id, reason);
      if (action === "reject") return rejectVendorListing(token, selected.id, reason);
      return markVendorListingReceived(token, selected.id, qty);
    });
  }

  if (!authorized || !user || !pendingVendors || !listings || !allVendors) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">{error ?? "Chargement…"}</main>;
  }

  const toDo = pendingVendors.length + listings.length;

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-extrabold">Vendeurs partenaires</h1>
          <p className="text-sm text-ink-2">Aucune annonce n&apos;est visible sur le site avant validation et réception du stock.</p>
        </header>

        <div className="mb-5 flex gap-1 rounded-xl bg-surface-2 p-1 sm:max-w-md">
          {(
            [
              { v: "traiter", l: `À traiter${toDo ? ` · ${toDo}` : ""}` },
              { v: "vendeurs", l: `Vendeurs (${allVendors.length})` },
            ] as const
          ).map((t) => (
            <button key={t.v} type="button" onClick={() => setTab(t.v)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${tab === t.v ? "bg-surface shadow-sm" : "text-ink-2"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

        {tab === "vendeurs" && (
          <section>
            {allVendors.length === 0 ? (
              <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Aucun vendeur pour l&apos;instant.</p>
            ) : (
              <ul className="grid gap-3">
                {allVendors.map((v) => {
                  const s = STATUS_STYLE[v.status];
                  return (
                    <li key={v.id} className="rounded-2xl border border-line bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-bold">{v.user?.fullName ?? v.user?.phone}</p>
                          <p className="text-xs text-ink-2">
                            {TYPE_LABEL[v.type]} · {v.zone} · {v.paymentInfo} · {v._count.listings} annonce{v._count.listings > 1 ? "s" : ""} · inscrit {formatRelativeTime(v.createdAt)}
                          </p>
                          {v.rejectionReason && <p className="mt-1 text-xs text-ink-2">Motif : {v.rejectionReason}</p>}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.tone}`}>{s.label}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        {v.status === "ACTIF" && (
                          <>
                            <input
                              value={vendorReason[v.id] ?? ""}
                              onChange={(e) => setVendorReason((r) => ({ ...r, [v.id]: e.target.value }))}
                              placeholder="Motif de la suspension"
                              className={`${field} max-w-xs`}
                            />
                            <button
                              type="button"
                              disabled={busy || !(vendorReason[v.id] ?? "").trim()}
                              onClick={() => run(() => suspendVendor(token!, v.id, vendorReason[v.id]))}
                              className="rounded-lg border border-down/40 px-3 py-2 text-xs font-bold text-down hover:bg-down/10 disabled:opacity-50"
                            >
                              Suspendre
                            </button>
                          </>
                        )}
                        {v.status === "SUSPENDU" && (
                          <button type="button" disabled={busy} onClick={() => run(() => reactivateVendor(token!, v.id))} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-on-brand disabled:opacity-60">
                            Réactiver
                          </button>
                        )}
                        {v.status === "EN_ATTENTE" && (
                          <>
                            <button type="button" disabled={busy} onClick={() => run(() => approveVendor(token!, v.id))} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-on-brand disabled:opacity-60">
                              Approuver
                            </button>
                            <button type="button" disabled={busy} onClick={() => run(() => rejectVendor(token!, v.id, "Non conforme"))} className="rounded-lg border border-down/40 px-3 py-2 text-xs font-bold text-down disabled:opacity-60">
                              Refuser
                            </button>
                          </>
                        )}
                        {v.status === "REFUSE" && <span className="text-xs text-ink-2">Le vendeur peut redéposer une demande.</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {tab === "traiter" && (
          <>
            {pendingVendors.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Comptes à valider ({pendingVendors.length})</h2>
                <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {pendingVendors.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
                      <div>
                        <p className="font-display font-bold">{v.user?.fullName ?? v.user?.phone}</p>
                        <p className="text-xs text-ink-2">
                          {TYPE_LABEL[v.type]} · {v.zone} · {v.paymentInfo}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled={busy} onClick={() => run(() => rejectVendor(token!, v.id, "Non conforme"))} className="rounded-lg border border-down px-3 py-1.5 text-xs font-bold text-down disabled:opacity-60">
                          Refuser
                        </button>
                        <button type="button" disabled={busy} onClick={() => run(() => approveVendor(token!, v.id))} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-on-brand disabled:opacity-60">
                          Approuver
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Annonces ({listings.length})</h2>
              {listings.length === 0 ? (
                <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Aucune annonce en attente.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[280px_1fr]">
                  <ul className="h-fit overflow-hidden rounded-2xl border border-line bg-surface">
                    {listings.map((l) => (
                      <li key={l.id} className="border-t border-line first:border-t-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(l.id);
                            setPhotoIndex(0);
                            setReason("");
                            setReceived("");
                          }}
                          className={`grid w-full gap-0.5 px-3 py-3 text-left text-sm ${l.id === selectedId ? "bg-brand-soft" : ""}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate font-display font-bold">{l.vendor.user?.fullName ?? l.vendor.user?.phone}</span>
                            <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ${l.status === "VALIDEE" ? "bg-brand-soft text-brand" : l.priceOutOfBand ? "bg-down/10 text-down" : "bg-accent-soft text-accent"}`}>
                              {l.status === "VALIDEE" ? "À réceptionner" : l.priceOutOfBand ? "Prix à vérifier" : "Nouvelle"}
                            </span>
                          </span>
                          <span className="text-xs text-ink-2">
                            {l.product.name} · {l.quantity} {l.product.unitLabel}
                          </span>
                          <span className="text-xs text-ink-2">{formatRelativeTime(l.createdAt)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {selected && (
                    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink-2">Annonce de {selected.vendor.user?.fullName ?? selected.vendor.user?.phone}</p>
                        <h2 className="font-display text-xl font-extrabold">
                          {selected.product.name} · {selected.quantity} {selected.product.unitLabel}
                        </h2>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
                        <div className="grid gap-2">
                          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-2">
                            {selectedPhotos[photoIndex] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={selectedPhotos[photoIndex]} alt="Photo de l'annonce" className="size-full object-cover" />
                            ) : (
                              <div className="grid size-full place-items-center text-xs text-ink-2">Aucune photo</div>
                            )}
                          </div>
                          {selectedPhotos.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {selectedPhotos.map((src, i) => (
                                <button key={i} type="button" onClick={() => setPhotoIndex(i)} aria-label={`Photo ${i + 1}`} className={`size-14 flex-none overflow-hidden rounded-lg border-2 ${i === photoIndex ? "border-brand" : "border-transparent"}`}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={src} alt="" className="size-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid h-fit gap-2 text-sm">
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <dt className="text-ink-2">Prix proposé</dt>
                            <dd className="font-semibold">{formatFCFA(selected.unitPrice)} F</dd>
                            <dt className="text-ink-2">Prix du marché</dt>
                            <dd className="font-semibold">{selected.referencePrice != null ? `${formatFCFA(selected.referencePrice)} F` : "—"}</dd>
                            <dt className="text-ink-2">Paiement du vendeur</dt>
                            <dd>{selected.vendor.paymentInfo}</dd>
                          </dl>
                          {selected.priceOutOfBand && (
                            <p className="rounded-lg bg-down/10 px-2.5 py-1.5 text-xs font-semibold text-down">Prix en dehors de la fourchette autorisée autour du prix du marché.</p>
                          )}
                        </div>
                      </div>

                      {selected.status === "VALIDEE" ? (
                        <>
                          <p className="rounded-xl border border-brand/40 bg-brand-soft px-3 py-2 text-sm">
                            Annonce validée. Confirmez la réception du stock au magasin pour la rendre achetable.
                          </p>
                          <label className="grid max-w-xs gap-1.5 text-xs font-semibold text-ink-2">
                            Quantité réellement reçue (annoncée : {selected.quantity})
                            <input inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value.replace(/\D/g, ""))} placeholder={String(selected.quantity)} className={field} />
                          </label>
                          <button type="button" disabled={busy} onClick={() => listingDecision("receive")} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
                            Marquer reçu au magasin
                          </button>
                        </>
                      ) : (
                        <>
                          <textarea
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Motif (obligatoire pour corriger ou refuser) — le vendeur le verra"
                            className={field}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={busy} onClick={() => listingDecision("reject")} className="rounded-xl border border-down px-4 py-2.5 text-sm font-bold text-down disabled:opacity-60">
                              Refuser
                            </button>
                            <button type="button" disabled={busy} onClick={() => listingDecision("correction")} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                              Demander une correction
                            </button>
                            <button type="button" disabled={busy} onClick={() => listingDecision("approve")} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
                              Approuver
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
