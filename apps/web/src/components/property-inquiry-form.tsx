"use client";

import { useState } from "react";
import { sendPropertyInquiry } from "@/lib/api";
import { SITE } from "@/lib/site";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-brand";

export function PropertyInquiryForm({ propertyId, title }: { propertyId: string; title: string }) {
  const [form, setForm] = useState({ name: "", phone: "+229 ", email: "", message: "Je souhaite visiter ce bien.", website: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendPropertyInquiry(propertyId, {
        name: form.name,
        phone: form.phone.trim(),
        email: form.email || undefined,
        message: form.message || undefined,
        website: form.website || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  const whatsapp = SITE.whatsapp
    ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par le bien « ${title} » sur OBP Market.`)}`
    : null;

  return (
    <div id="visite" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-5">
      {sent ? (
        <div className="py-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-up/10 text-up">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="mt-3 font-display text-lg font-extrabold">Demande envoyée</p>
          <p className="mt-1 text-sm text-ink-2">L&apos;équipe OBP Market vous rappelle très vite pour organiser la visite.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3.5">
          <div>
            <h2 className="font-display text-lg font-extrabold">Demander une visite</h2>
            <p className="text-xs text-ink-2">OBP Market vous rappelle pour convenir d&apos;un rendez-vous.</p>
          </div>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Nom complet *
            <input required minLength={2} value={form.name} onChange={set("name")} className={input} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Téléphone *
            <input required type="tel" minLength={8} value={form.phone} onChange={set("phone")} className={input} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            E-mail
            <input type="email" value={form.email} onChange={set("email")} className={input} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Message
            <textarea rows={3} value={form.message} onChange={set("message")} className={input} />
          </label>
          <input tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand disabled:opacity-60">
            {busy ? "Envoi…" : "Être rappelé(e)"}
          </button>
        </form>
      )}

      {(whatsapp || SITE.phone) && (
        <div className="mt-4 grid gap-2 border-t border-line pt-4">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line py-3 text-center text-sm font-bold hover:bg-surface-2">
              Écrire sur WhatsApp
            </a>
          )}
          {SITE.phone && (
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="rounded-xl border border-line py-3 text-center text-sm font-bold hover:bg-surface-2">
              Appeler {SITE.phone}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
