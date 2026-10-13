"use client";

import { useState } from "react";
import { becomeVendor, type VendorType } from "@/lib/api";

export const VENDOR_TYPE_LABEL: Record<VendorType, { title: string; desc: string }> = {
  PARTICULIER: { title: "Particulier", desc: "Je vends occasionnellement ma récolte ou mon surplus." },
  PROFESSIONNEL: { title: "Professionnel", desc: "Commerçant ou producteur régulier." },
  COOPERATIVE: { title: "Coopérative", desc: "Groupement de producteurs." },
};

const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";

/** Ouverture du compte vendeur avec le lien d'invitation : type, zone d'activité et moyen de recevoir les ventes. */
export function VendorForm({
  token,
  inviteToken,
  initialType,
  initialZone,
  onDone,
}: {
  token: string;
  inviteToken: string;
  initialType?: VendorType | null;
  initialZone?: string | null;
  onDone: () => void;
}) {
  const [type, setType] = useState<VendorType>(initialType ?? "PROFESSIONNEL");
  const [zone, setZone] = useState(initialZone ?? "Cotonou et environs");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!paymentInfo.trim()) {
      setError("Indiquez comment recevoir vos ventes (ex. MTN MoMo).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await becomeVendor(token, type, zone.trim(), paymentInfo.trim(), inviteToken);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ouverture du compte.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <span className="text-xs font-semibold text-ink-2">Type de compte</span>
        {(Object.keys(VENDOR_TYPE_LABEL) as VendorType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={`rounded-xl border-2 p-3 text-left text-sm ${type === t ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <span className="block font-bold">{VENDOR_TYPE_LABEL[t].title}</span>
            <span className="text-xs text-ink-2">{VENDOR_TYPE_LABEL[t].desc}</span>
          </button>
        ))}
      </div>

      <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
        Zone d&apos;activité
        <input value={zone} onChange={(e) => setZone(e.target.value)} className={field} />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
        Recevoir mes ventes sur
        <input placeholder="MTN MoMo · 01 xx xx xx xx" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} className={field} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">
          {error}
        </p>
      )}

      <button type="button" disabled={busy || zone.trim().length < 2} onClick={submit} className="rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand disabled:opacity-60">
        {busy ? "Ouverture du compte…" : "Ouvrir mon compte vendeur"}
      </button>
    </div>
  );
}
