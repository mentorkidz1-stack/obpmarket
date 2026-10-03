"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { sendContactMessage } from "@/lib/api";
import { SITE } from "@/lib/site";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-brand";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendContactMessage({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        subject: form.subject,
        message: form.message,
        website: form.website || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  const channels = [
    SITE.whatsapp && { label: "WhatsApp", value: `+${SITE.whatsapp}`, href: `https://wa.me/${SITE.whatsapp}` },
    SITE.phone && { label: "Téléphone", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    SITE.email && { label: "E-mail", value: SITE.email, href: `mailto:${SITE.email}` },
    SITE.address && { label: "Adresse", value: SITE.address, href: undefined },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero title="Contact" crumb="Contact" subtitle="Une question, un souci avec une commande ? Écrivez-nous, nous vous répondons rapidement." />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className={`grid gap-8 ${channels.length > 0 ? "lg:grid-cols-[1fr_320px]" : "mx-auto max-w-2xl"}`}>
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            {sent ? (
              <div className="py-10 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-up/10 text-up">
                  <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <p className="mt-4 font-display text-xl font-extrabold">Message envoyé</p>
                <p className="mt-1 text-sm text-ink-2">Merci, nous revenons vers vous très vite.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4">
                <h2 className="font-display text-xl font-extrabold">Envoyez-nous un message</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
                    Nom complet *
                    <input required minLength={2} value={form.name} onChange={set("name")} className={input} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
                    Téléphone
                    <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+229 …" className={input} />
                  </label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
                  E-mail
                  <input type="email" value={form.email} onChange={set("email")} className={input} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
                  Sujet *
                  <input required minLength={3} value={form.subject} onChange={set("subject")} className={input} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
                  Message *
                  <textarea required minLength={10} rows={6} value={form.message} onChange={set("message")} className={input} />
                </label>
                {/* Champ piège anti-robots : invisible et hors navigation clavier. */}
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  value={form.website}
                  onChange={set("website")}
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <p className="text-[11px] text-ink-2">Indiquez au moins un téléphone ou un e-mail pour que nous puissions vous répondre.</p>
                {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
                <button type="submit" disabled={busy} className="rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand disabled:opacity-60">
                  {busy ? "Envoi…" : "Envoyer le message"}
                </button>
              </form>
            )}
          </div>

          {channels.length > 0 && (
            <aside className="h-fit rounded-3xl bg-brand-soft p-6">
              <h2 className="font-display text-lg font-extrabold">Autres moyens de nous joindre</h2>
              <ul className="mt-4 grid gap-4">
                {channels.map((c) => (
                  <li key={c.label}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="font-semibold text-brand">
                        {c.value}
                      </a>
                    ) : (
                      <p className="font-semibold">{c.value}</p>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
