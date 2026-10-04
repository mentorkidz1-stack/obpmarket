"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getMyShop, saveMyShop, type MyShop } from "@/lib/api";
import { Money } from "@/components/money";
import { ShopShare, shopUrl } from "@/components/shop-actions";
import { useUI } from "@/components/ui-provider";

const field = "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-bg p-3 text-center">
      <p className="font-display text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] text-ink-2">{label}</p>
    </div>
  );
}

/** « Ma boutique » : le vendeur crée sa vitrine publique, partage son lien et suit ses visites. */
export function VendorShopPanel({ token }: { token: string }) {
  const { notify } = useUI();
  const [shop, setShop] = useState<MyShop | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getMyShop(token)
      .then((s) => {
        setShop(s);
        setName(s.shopName ?? "");
        setDescription(s.shopDescription ?? "");
        setWhatsapp(s.shopWhatsapp ?? "");
        setEditing(!s.shopName);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);
  useEffect(load, [load]);

  async function save(extra: { shopPublished?: boolean } = {}) {
    setBusy(true);
    setError(null);
    try {
      const next = await saveMyShop(token, { shopName: name.trim(), shopDescription: description.trim(), shopWhatsapp: whatsapp.replace(/\D/g, ""), ...extra });
      setShop(next);
      setEditing(false);
      notify(extra.shopPublished === true ? "Votre boutique est en ligne" : extra.shopPublished === false ? "Votre boutique est masquée" : "Boutique enregistrée");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished() {
    if (!shop) return;
    setBusy(true);
    setError(null);
    try {
      const next = await saveMyShop(token, { shopPublished: !shop.shopPublished });
      setShop(next);
      notify(next.shopPublished ? "Votre boutique est en ligne" : "Votre boutique est masquée");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'action.");
    } finally {
      setBusy(false);
    }
  }

  if (!shop) {
    return <div className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-2">{error ?? "Chargement de votre boutique…"}</div>;
  }

  const link = shop.slug ? shopUrl(shop.slug) : null;
  const max = Math.max(1, ...shop.stats.series.map((s) => s.views));

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Ma boutique">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Ma boutique</p>
          <h2 className="font-display text-lg font-extrabold">{shop.shopName ?? "Ouvrez votre boutique"}</h2>
          <p className="text-sm text-ink-2">Une page à vous, avec un lien à partager sur WhatsApp, Facebook ou en statut : vos clients y retrouvent vos produits.</p>
        </div>
        {shop.shopName && (
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-sm font-bold text-brand">
            {editing ? "Annuler" : "Modifier"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      {editing && (
        <div className="mt-4 grid gap-3 border-t border-line pt-4">
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Nom de la boutique
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ex. Chez Mamy, produits frais" className={field} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Présentation (facultatif)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={600} placeholder="Qui êtes-vous, que vendez-vous, d'où viennent vos produits ?" className={field} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Numéro WhatsApp affiché (facultatif, avec l&apos;indicatif)
            <input inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="22997000000" className={field} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy || name.trim().length < 3} onClick={() => save()} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            {!shop.shopPublished && (
              <button type="button" disabled={busy || name.trim().length < 3} onClick={() => save({ shopPublished: true })} className="rounded-xl border border-brand px-5 py-2.5 text-sm font-bold text-brand disabled:opacity-60">
                Enregistrer et mettre en ligne
              </button>
            )}
          </div>
        </div>
      )}

      {!editing && link && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${shop.shopPublished ? "bg-up/10 text-up" : "bg-surface-2 text-ink-2"}`}>{shop.shopPublished ? "En ligne" : "Masquée"}</span>
            <code className="min-w-0 flex-1 truncate rounded-lg bg-bg px-3 py-1.5 text-xs">{link}</code>
            <button type="button" disabled={busy} onClick={togglePublished} className="text-xs font-bold text-brand">
              {shop.shopPublished ? "Masquer la boutique" : "Mettre en ligne"}
            </button>
          </div>

          {shop.shopPublished ? (
            <>
              <ShopShare slug={shop.slug!} name={shop.shopName ?? "Ma boutique"} />
              <Link href={`/boutique-de/${shop.slug}`} className="w-fit text-sm font-bold text-brand">
                Voir ma boutique comme un client →
              </Link>
            </>
          ) : (
            <p className="text-sm text-ink-2">Votre boutique n&apos;est pas visible : mettez-la en ligne pour pouvoir partager le lien.</p>
          )}

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">30 derniers jours</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Visites" value={shop.stats.last30Days.views} />
              <Stat label="Partages" value={shop.stats.last30Days.shares} />
              <Stat label="Contacts WhatsApp" value={shop.stats.last30Days.contacts} />
              <Stat label={`Ventes (${shop.stats.sales30Days.units} unité${shop.stats.sales30Days.units > 1 ? "s" : ""})`} value={<Money value={shop.stats.sales30Days.amount} unitClassName="text-xs text-ink-2" />} />
            </div>
            <div className="mt-3 flex h-16 items-end gap-1" role="img" aria-label="Visites des 14 derniers jours">
              {shop.stats.series.map((s) => (
                <div key={s.date} title={`${new Date(s.date).toLocaleDateString("fr-FR")} · ${s.views} visite(s)`} className={`flex-1 rounded-t ${s.views > 0 ? "bg-brand" : "bg-surface-2"}`} style={{ height: `${Math.max(6, (s.views / max) * 100)}%` }} />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-2">Visites par jour, sur 14 jours.</p>
          </div>
        </div>
      )}
    </section>
  );
}
