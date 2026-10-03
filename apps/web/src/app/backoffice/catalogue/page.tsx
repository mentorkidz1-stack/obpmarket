"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  renameCategory,
  updateProduct,
  type CategoryWithCount,
  type Product,
  type ProductInput,
} from "@/lib/api";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const EMPTY: ProductInput = { name: "", categoryId: "", unitLabel: "kg", isPerishable: false, isStockable: false };

function Catalogue({ token, user }: StaffContext) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [newCategory, setNewCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, []);
  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await action();
      setMsg({ kind: "ok", text: ok });
      load();
      return true;
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(p: Product | null) {
    setEditing(p ? p.id : "new");
    setForm(p ? { name: p.name, categoryId: p.categoryId, unitLabel: p.unitLabel, isPerishable: p.isPerishable, isStockable: p.isStockable } : { ...EMPTY, categoryId: categories[0]?.id ?? "" });
    setMsg(null);
  }

  async function save() {
    const ok = await run(() => (editing === "new" ? createProduct(token, form) : updateProduct(token, editing!, form)), editing === "new" ? "Produit créé." : "Produit modifié.");
    if (ok) setEditing(null);
  }

  const shown = (products ?? []).filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="grid gap-6">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {editing && (
        <section className="grid gap-3 rounded-2xl border border-brand/40 bg-surface p-5" aria-label="Formulaire produit">
          <h2 className="font-display text-lg font-bold">{editing === "new" ? "Nouveau produit" : "Modifier le produit"}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Nom
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Catégorie
              <select className={inputCls} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Unité de vente (kg, sac, pièce…)
              <input className={inputCls} value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isPerishable} onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })} />
              Denrée périssable
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isStockable} onChange={(e) => setForm({ ...form, isStockable: e.target.checked })} />
              Géré en stock magasin
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy || !form.name.trim() || !form.categoryId || !form.unitLabel.trim()} onClick={save} className={btnPrimary}>
              Enregistrer
            </button>
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </section>
      )}

      <section aria-label="Produits">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input className={`${inputCls} max-w-xs`} placeholder="Rechercher un produit…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <button type="button" onClick={() => startEdit(null)} className={`${btnPrimary} ml-auto`}>
            + Nouveau produit
          </button>
        </div>
        {!products ? (
          <Empty>Chargement…</Empty>
        ) : shown.length === 0 ? (
          <Empty>Aucun produit.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
                <tr>
                  <th className="px-3 py-2">Produit</th>
                  <th className="px-3 py-2">Catégorie</th>
                  <th className="px-3 py-2">Unité</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-3 py-2 font-semibold">
                      {p.name}
                      {p.isPerishable && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px]">périssable</span>}
                    </td>
                    <td className="px-3 py-2 text-ink-2">{p.category?.name}</td>
                    <td className="px-3 py-2 text-ink-2">{p.unitLabel}</td>
                    <td className="px-3 py-2 font-mono">{p.isStockable ? p.stockQuantity : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => startEdit(p)} className="mr-3 text-xs font-bold text-brand">
                        Modifier
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => confirm(`Supprimer « ${p.name} » ? Impossible s'il a déjà des commandes ou des relevés.`) && run(() => deleteProduct(token, p.id), "Produit supprimé.")}
                          className="text-xs font-bold text-down"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Catégories" className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Catégories</h2>
        <ul className="grid gap-2">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{c.name}</span>
              <span className="text-xs text-ink-2">{c._count.products} produit(s)</span>
              <button
                type="button"
                className="ml-auto text-xs font-bold text-brand"
                onClick={() => {
                  const name = prompt("Nouveau nom de la catégorie", c.name)?.trim();
                  if (name && name !== c.name) run(() => renameCategory(token, c.id, name), "Catégorie renommée.");
                }}
              >
                Renommer
              </button>
              {isAdmin && c._count.products === 0 && (
                <button type="button" className="text-xs font-bold text-down" onClick={() => confirm(`Supprimer la catégorie « ${c.name} » ?`) && run(() => deleteCategory(token, c.id), "Catégorie supprimée.")}>
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => createCategory(token, newCategory.trim()), "Catégorie créée.")) setNewCategory("");
          }}
        >
          <input className={`${inputCls} max-w-xs`} placeholder="Nouvelle catégorie" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <button type="submit" disabled={busy || !newCategory.trim()} className={btnGhost}>
            Ajouter
          </button>
        </form>
      </section>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_PRIX", "ADMIN"]} title="Catalogue" subtitle="Les produits vendus, leur unité et leur catégorie. Les photos se gèrent dans « Photos des produits ».">
      {(ctx) => <Catalogue {...ctx} />}
    </BackofficePage>
  );
}
