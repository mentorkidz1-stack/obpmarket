"use client";

import { useCallback, useEffect, useState } from "react";
import { adjustProductStock, getProducts, type Product } from "@/lib/api";
import { BackofficePage, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

function Stock({ token }: StaffContext) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    getProducts()
      .then((p) => setProducts(p.filter((x) => x.isStockable)))
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, []);
  useEffect(load, [load]);

  async function save(p: Product) {
    setBusy(true);
    setMsg(null);
    try {
      await adjustProductStock(token, p.id, Number(quantity), reason.trim());
      setMsg({ kind: "ok", text: `Stock de « ${p.name} » mis à jour : ${quantity} ${p.unitLabel}.` });
      setOpen(null);
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de la mise à jour." });
    } finally {
      setBusy(false);
    }
  }

  const shown = (products ?? []).filter((p) => p.name.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => a.stockQuantity - b.stockQuantity);

  return (
    <div className="grid gap-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <input className={`${inputCls} max-w-xs`} placeholder="Rechercher un produit…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      {!products ? (
        <Empty>Chargement…</Empty>
      ) : shown.length === 0 ? (
        <Empty>Aucun produit géré en stock.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
          {shown.map((p) => (
            <li key={p.id} className="border-t border-line first:border-t-0">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-semibold">{p.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${p.stockQuantity === 0 ? "bg-down/10 text-down" : p.stockQuantity < 10 ? "bg-accent-soft" : "bg-surface-2"}`}>
                  {p.stockQuantity} {p.unitLabel}
                </span>
                <button
                  type="button"
                  className="ml-auto text-xs font-bold text-brand"
                  onClick={() => {
                    setOpen(open === p.id ? null : p.id);
                    setQuantity(String(p.stockQuantity));
                    setReason("");
                  }}
                >
                  Ajuster
                </button>
              </div>
              {open === p.id && (
                <div className="grid gap-3 border-t border-line bg-bg px-4 py-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                  <label className="grid gap-1 text-xs font-semibold text-ink-2">
                    Nouveau total
                    <input inputMode="numeric" className={inputCls} value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-2">
                    Motif (réception, casse, inventaire…)
                    <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                  <button type="button" disabled={busy || quantity === "" || reason.trim().length < 3} onClick={() => save(p)} className={btnPrimary}>
                    Enregistrer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-2">Chaque ajustement est consigné dans le journal d&apos;activité avec l&apos;ancien et le nouveau total.</p>
    </div>
  );
}

export default function StockPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "AGENT_MAGASIN", "ADMIN"]} title="Stock en magasin" subtitle="Les produits à retirer en magasin, du plus bas stock au plus haut." width="max-w-4xl">
      {(ctx) => <Stock {...ctx} />}
    </BackofficePage>
  );
}
