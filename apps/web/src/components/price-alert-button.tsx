"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useUI } from "@/components/ui-provider";
import { useCurrency } from "@/components/currency-provider";
import { savePriceAlert } from "@/lib/api";

/** « Me prévenir si le prix baisse » : un seuil en FCFA, notifié dans le site (et par WhatsApp si le client l'a accepté). */
export function PriceAlertButton({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const { token, ready } = useAuth();
  const { notify } = useUI();
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(Math.round(currentPrice * 0.95)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  if (!token) {
    return (
      <Link
        href={`/connexion?next=${encodeURIComponent(`/produits/${productId}`)}`}
        className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-bold hover:bg-surface-2"
      >
        Me prévenir si le prix baisse
      </Link>
    );
  }

  async function save() {
    if (!token) return;
    const target = Number(value);
    if (!target || target <= 0) {
      setError("Entrez un prix supérieur à 0.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await savePriceAlert(token, productId, target);
      notify("Alerte enregistrée", { label: "Mes alertes", href: "/alertes" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-bold">
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
          Me prévenir si le prix baisse
        </span>
        <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-line p-4">
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Prévenez-moi quand le prix passe sous (FCFA)
            <input
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-bold outline-none focus:border-brand"
            />
          </label>
          {currency !== "XOF" && <p className="text-[11px] text-ink-2">Le seuil se saisit en FCFA.</p>}
          {error && <p className="text-sm text-down">{error}</p>}
          <button type="button" disabled={busy} onClick={save} className="rounded-xl bg-brand py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
            {busy ? "Enregistrement…" : "Activer l'alerte"}
          </button>
        </div>
      )}
    </div>
  );
}
