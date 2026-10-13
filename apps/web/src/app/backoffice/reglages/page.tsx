"use client";

import { useEffect, useState } from "react";
import { getShopSettings, saveShopSettings, type ShopSettings } from "@/lib/api";
import { formatFCFA } from "@/lib/format";
import { BackofficePage, btnPrimary, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink-2">{hint}</p>
      </div>
      {children}
    </section>
  );
}

const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));

function Settings({ token }: StaffContext) {
  const [saved, setSaved] = useState<ShopSettings | null>(null);
  const [form, setForm] = useState<{ vatEnabled: boolean; vatRate: string; vatDefaultDisplay: "TTC" | "HT"; markupPct: string; storageFreeDays: string; storageFeePct: string; storageFeeMonthly: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function load(s: ShopSettings) {
    setSaved(s);
    setForm({
      vatEnabled: s.vatEnabled,
      vatRate: String(s.vatRate),
      vatDefaultDisplay: s.vatDefaultDisplay,
      markupPct: String(s.markupPct),
      storageFreeDays: String(s.storageFreeDays),
      storageFeePct: String(s.storageFeePct),
      storageFeeMonthly: s.storageFeeMonthly,
    });
  }

  useEffect(() => {
    getShopSettings(token)
      .then(load)
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token]);

  if (!form || !saved) return msg ? <Notice kind="error">{msg.text}</Notice> : <p className="text-sm text-ink-2">Chargement…</p>;

  const rate = num(form.vatRate);
  const markup = num(form.markupPct);
  const freeDays = num(form.storageFreeDays);
  const feePct = num(form.storageFeePct);
  const valid =
    Number.isFinite(rate) && rate >= 0 && rate <= 100 &&
    Number.isFinite(markup) && markup >= 0 && markup <= 100 &&
    Number.isInteger(freeDays) && freeDays >= 0 && freeDays <= 3650 &&
    Number.isFinite(feePct) && feePct >= 0 && feePct <= 100;

  // Exemple chiffré, pour vérifier d'un coup d'œil l'effet des réglages.
  const market = 20_000;
  const selling = Math.round(market * (1 + (Number.isFinite(markup) ? markup : 0) / 100));
  const withVat = form.vatEnabled ? Math.round(selling * (1 + (Number.isFinite(rate) ? rate : 0) / 100)) : selling;
  const purchase = 100_000;
  const fee = Math.round(purchase * ((Number.isFinite(feePct) ? feePct : 0) / 100));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const next = await saveShopSettings(token, {
        vatEnabled: form!.vatEnabled,
        vatRate: rate,
        vatDefaultDisplay: form!.vatDefaultDisplay,
        markupPct: markup,
        storageFreeDays: freeDays,
        storageFeePct: feePct,
        storageFeeMonthly: form!.storageFeeMonthly,
      });
      load(next);
      setMsg({ kind: "ok", text: "Réglages enregistrés : ils s'appliquent tout de suite aux prix affichés et aux nouvelles commandes." });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'enregistrement." });
    } finally {
      setBusy(false);
    }
  }

  const toggle = "flex items-center gap-2 text-sm font-semibold";

  return (
    <div className="grid gap-5">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <Section title="Prix affiché" hint="Le prix payé par le client est le prix moyen relevé sur les marchés, majoré du pourcentage ci-dessous.">
        <label className="grid max-w-xs gap-1 text-xs font-semibold text-ink-2">
          Majoration sur le prix moyen (%)
          <input inputMode="decimal" className={inputCls} value={form.markupPct} onChange={(e) => setForm({ ...form, markupPct: e.target.value })} />
        </label>
        <p className="rounded-xl bg-bg px-3 py-2 text-sm">
          Exemple : prix moyen des marchés <strong>{formatFCFA(market)} F</strong> → prix affiché <strong>{formatFCFA(selling)} F</strong> hors taxe.
        </p>
      </Section>

      <Section title="TVA" hint="Les visiteurs peuvent afficher les prix avec taxe (TTC) ou hors taxe (HT). Chaque produit peut aussi être exonéré ou avoir son propre taux dans le Catalogue.">
        <label className={toggle}>
          <input type="checkbox" checked={form.vatEnabled} onChange={(e) => setForm({ ...form, vatEnabled: e.target.checked })} />
          Appliquer la TVA sur le site
        </label>
        {form.vatEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Taux de TVA par défaut (%)
              <input inputMode="decimal" className={inputCls} value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Affichage proposé à l&apos;arrivée
              <select className={inputCls} value={form.vatDefaultDisplay} onChange={(e) => setForm({ ...form, vatDefaultDisplay: e.target.value as "TTC" | "HT" })}>
                <option value="TTC">Avec taxe (TTC)</option>
                <option value="HT">Hors taxe (HT)</option>
              </select>
            </label>
          </div>
        )}
        <p className="rounded-xl bg-bg px-3 py-2 text-sm">
          {form.vatEnabled ? (
            <>
              Exemple : {formatFCFA(selling)} F hors taxe → <strong>{formatFCFA(withVat)} F</strong> avec {Number.isFinite(rate) ? rate : 0} % de TVA. Le montant payé par le client est toujours le total TTC.
            </>
          ) : (
            <>La TVA est désactivée : tous les prix sont affichés et facturés sans taxe, et le choix HT / TTC disparaît du site.</>
          )}
        </p>
      </Section>

      <Section title="Frais de stockage" hint="Un produit acheté reste gratuitement au magasin pendant la durée ci-dessous. Ensuite, des frais s'appliquent : ils sont retenus à la revente, et à régler au magasin avant un retrait.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Durée gratuite (jours)
            <input inputMode="numeric" className={inputCls} value={form.storageFreeDays} onChange={(e) => setForm({ ...form, storageFreeDays: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Frais de stockage (% du prix d&apos;achat)
            <input inputMode="decimal" className={inputCls} value={form.storageFeePct} onChange={(e) => setForm({ ...form, storageFeePct: e.target.value })} />
          </label>
        </div>
        <label className={toggle}>
          <input type="checkbox" checked={form.storageFeeMonthly} onChange={(e) => setForm({ ...form, storageFeeMonthly: e.target.checked })} />
          Appliquer ces frais chaque mois entamé après la durée gratuite (sinon : une seule fois)
        </label>
        <p className="rounded-xl bg-bg px-3 py-2 text-sm">
          Exemple : un achat de <strong>{formatFCFA(purchase)} F</strong> conservé plus de {Number.isFinite(freeDays) ? freeDays : 0} jours → <strong>{formatFCFA(fee)} F</strong> de frais
          {form.storageFeeMonthly ? " par mois entamé" : " (une seule fois)"}.
        </p>
      </Section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !valid} className={btnPrimary}>
          {busy ? "Enregistrement…" : "Enregistrer les réglages"}
        </button>
        {!valid && <span className="text-sm text-down">Vérifiez les valeurs : pourcentages entre 0 et 100, durée en jours entiers.</span>}
      </div>
      <p className="text-xs text-ink-2">Chaque modification est consignée au journal d&apos;activité.</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <BackofficePage roles={["ADMIN"]} title="Réglages commerciaux" subtitle="TVA, majoration du prix affiché et frais de stockage. Les changements s'appliquent immédiatement." width="max-w-3xl">
      {(ctx) => <Settings {...ctx} />}
    </BackofficePage>
  );
}
