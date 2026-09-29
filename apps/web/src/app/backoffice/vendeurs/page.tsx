"use client";

import { useEffect, useState } from "react";
import {
  approveVendor,
  approveVendorListing,
  getPendingVendorListings,
  getPendingVendors,
  markVendorListingReceived,
  rejectVendor,
  rejectVendorListing,
  requestVendorListingCorrection,
  type VendorListingRecord,
  type VendorProfileRecord,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

export default function VendorModerationPage() {
  const { user, token, authorized, logout } = useStaffSession(["MODERATEUR", "ADMIN"]);
  const [vendors, setVendors] = useState<VendorProfileRecord[] | null>(null);
  const [listings, setListings] = useState<VendorListingRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    Promise.all([getPendingVendors(t), getPendingVendorListings(t)]).then(([v, l]) => {
      setVendors(v);
      setListings(l);
      setSelectedId((prev) => prev ?? l.find((x) => x.status === "EN_ATTENTE")?.id ?? l[0]?.id ?? null);
    });
  }

  useEffect(() => {
    if (token) reload(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selected = listings?.find((l) => l.id === selectedId) ?? null;
  const selectedPhotos: string[] = selected ? JSON.parse(selected.photos || "[]") : [];

  async function vendorDecision(id: string, action: "approve" | "reject") {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "approve") await approveVendor(token, id);
      else await rejectVendor(token, id, reason || "Non conforme");
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  async function listingDecision(action: "approve" | "correction" | "reject" | "receive") {
    if (!selected || !token) return;
    if ((action === "correction" || action === "reject") && !reason.trim()) {
      setError("Un motif est nécessaire.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (action === "approve") await approveVendorListing(token, selected.id);
      else if (action === "correction") await requestVendorListingCorrection(token, selected.id, reason);
      else if (action === "reject") await rejectVendorListing(token, selected.id, reason);
      else await markVendorListingReceived(token, selected.id);
      setReason("");
      setPhotoIndex(0);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized || !user || !vendors || !listings) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold">Vendeurs partenaires</h1>
          <p className="text-sm text-ink-2">Aucune annonce n&apos;est visible sur le site avant validation.</p>
        </header>

        {error && <p className="mb-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

        {vendors.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-2">Comptes à valider ({vendors.length})</h2>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {vendors.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
                  <div>
                    <p className="font-display font-bold">{v.user?.fullName ?? v.user?.phone}</p>
                    <p className="text-xs text-ink-2">{v.type} · {v.zone} · {v.paymentInfo}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => vendorDecision(v.id, "reject")} className="rounded-lg border border-down px-3 py-1.5 text-xs font-semibold text-down">
                      Refuser
                    </button>
                    <button type="button" disabled={busy} onClick={() => vendorDecision(v.id, "approve")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-on-brand">
                      Approuver
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-2">Annonces ({listings.length})</h2>
          {listings.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
              Aucune annonce en attente.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-[280px_1fr]">
              <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
                {listings.map((l) => (
                  <li key={l.id} className="border-t border-line first:border-t-0">
                    <button
                      type="button"
                      onClick={() => { setSelectedId(l.id); setPhotoIndex(0); setReason(""); }}
                      className={`grid w-full gap-0.5 px-3 py-3 text-left text-sm ${l.id === selectedId ? "bg-brand-soft" : ""}`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-display font-bold">{l.vendor.user?.fullName ?? l.vendor.user?.phone}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.status === "VALIDEE" ? "bg-brand-soft text-brand" : l.priceOutOfBand ? "bg-down/10 text-down" : "bg-accent-soft text-ink"}`}>
                          {l.status === "VALIDEE" ? "À réceptionner" : l.priceOutOfBand ? "Hors fourchette" : "Nouvelle"}
                        </span>
                      </span>
                      <span className="text-xs text-ink-2">{l.product.name} · {l.quantity} {l.product.unitLabel}</span>
                      <span className="text-xs text-ink-2">{formatRelativeTime(l.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {selected && (
                <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-2">
                        Annonce de {selected.vendor.user?.fullName ?? selected.vendor.user?.phone}
                      </p>
                      <h2 className="font-display text-xl font-bold">{selected.product.name} · {selected.quantity} {selected.product.unitLabel}</h2>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1.1fr_1fr]">
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={src}
                              alt={`Miniature ${i + 1}`}
                              onClick={() => setPhotoIndex(i)}
                              className={`size-14 flex-none cursor-pointer rounded-lg border-2 object-cover ${i === photoIndex ? "border-brand" : "border-transparent"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm">
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <dt className="text-ink-2">Prix proposé</dt>
                        <dd>{formatFCFA(selected.unitPrice)} F</dd>
                        <dt className="text-ink-2">Prix du marché</dt>
                        <dd>{selected.referencePrice != null ? `${formatFCFA(selected.referencePrice)} F` : "—"}</dd>
                      </dl>
                      {selected.priceOutOfBand && (
                        <p className="rounded-lg bg-down/10 px-2 py-1 text-xs font-semibold text-down">
                          Prix hors de la fourchette autorisée (RG-16).
                        </p>
                      )}
                    </div>
                  </div>

                  {selected.status === "VALIDEE" ? (
                    <>
                      <p className="rounded-xl border border-brand/40 bg-brand-soft px-3 py-2 text-sm">
                        Annonce déjà validée. Confirmez la réception physique au magasin pour la rendre achetable (RG-14).
                      </p>
                      <button type="button" disabled={busy} onClick={() => listingDecision("receive")} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60">
                        Marquer reçu au magasin
                      </button>
                    </>
                  ) : (
                    <>
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Motif (obligatoire pour corriger ou refuser)"
                        className="rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => listingDecision("reject")} className="rounded-xl border border-down px-4 py-2.5 text-sm font-semibold text-down disabled:opacity-60">
                          Refuser
                        </button>
                        <button type="button" disabled={busy} onClick={() => listingDecision("correction")} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
                          Demander une correction
                        </button>
                        <button type="button" disabled={busy} onClick={() => listingDecision("approve")} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60">
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
      </main>
    </>
  );
}
