"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useCurrency } from "@/components/currency-provider";
import type { Product, ReferencePrice } from "@/lib/api";

type Sort = "nom" | "prix-asc" | "prix-desc" | "hausse" | "baisse";

const SORTS: { value: Sort; label: string }[] = [
  { value: "nom", label: "Nom (A–Z)" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "hausse", label: "Plus fortes hausses (7 j)" },
  { value: "baisse", label: "Plus fortes baisses (7 j)" },
];

const STEP = 12;

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export interface CatalogInitial {
  categorie?: string;
  q?: string;
  tri?: string;
  vue?: string;
  stock?: string;
  type?: string;
  min?: string;
  max?: string;
}

/** Catalogue complet façon Motta : filtres latéraux, tri, vue grille/liste, « afficher plus ». */
export function ShopCatalog({
  products,
  prices,
  initial,
}: {
  products: Product[];
  prices: Map<string, ReferencePrice>;
  initial: CatalogInitial;
}) {
  const { currency } = useCurrency();
  const [query, setQuery] = useState(initial.q ?? "");
  const [category, setCategory] = useState<string | null>(initial.categorie ?? null);
  const [sort, setSort] = useState<Sort>(SORTS.some((s) => s.value === initial.tri) ? (initial.tri as Sort) : "nom");
  const [view, setView] = useState<"grid" | "list">(initial.vue === "liste" ? "list" : "grid");
  const [inStock, setInStock] = useState(initial.stock === "1");
  const [type, setType] = useState<"all" | "frais" | "stockable">(initial.type === "frais" || initial.type === "stockable" ? initial.type : "all");
  const [min, setMin] = useState(initial.min ?? "");
  const [max, setMax] = useState(initial.max ?? "");
  // Le nombre de produits affichés repart de zéro dès que les filtres changent (clé de filtre mémorisée avec le compteur).
  const filterKey = [query, category, sort, inStock, type, min, max].join("|");
  const [shown, setShown] = useState({ key: filterKey, count: STEP });
  const visible = shown.key === filterKey ? shown.count : STEP;
  const setVisible = (update: (v: number) => number) => setShown({ key: filterKey, count: update(visible) });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of products) {
      const e = map.get(p.category.id);
      if (e) e.count += 1;
      else map.set(p.category.id, { id: p.category.id, name: p.category.name, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [products]);

  const bounds = useMemo(() => {
    const values = [...prices.values()].map((p) => p.value);
    return values.length ? { lo: Math.floor(Math.min(...values)), hi: Math.ceil(Math.max(...values)) } : null;
  }, [prices]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const lo = min ? Number(min) : null;
    const hi = max ? Number(max) : null;
    const list = products.filter((p) => {
      if (category && p.categoryId !== category) return false;
      if (q && !normalize(p.name).includes(q) && !normalize(p.category.name).includes(q)) return false;
      if (inStock && p.stockQuantity === 0) return false;
      if (type === "frais" && !p.isPerishable) return false;
      if (type === "stockable" && !p.isStockable) return false;
      const price = prices.get(p.id)?.value;
      if ((lo != null || hi != null) && price == null) return false;
      if (lo != null && price! < lo) return false;
      if (hi != null && price! > hi) return false;
      return true;
    });
    const priceOf = (p: Product) => prices.get(p.id)?.value ?? Number.POSITIVE_INFINITY;
    const changeOf = (p: Product) => prices.get(p.id)?.changePct7d ?? 0;
    return list.sort((a, b) => {
      switch (sort) {
        case "prix-asc":
          return priceOf(a) - priceOf(b);
        case "prix-desc":
          return (priceOf(b) === Infinity ? -1 : priceOf(b)) - (priceOf(a) === Infinity ? -1 : priceOf(a));
        case "hausse":
          return changeOf(b) - changeOf(a);
        case "baisse":
          return changeOf(a) - changeOf(b);
        default:
          return a.name.localeCompare(b.name, "fr");
      }
    });
  }, [products, prices, category, query, inStock, type, min, max, sort]);

  // L'adresse reflète les filtres : on peut partager ou recharger une recherche.
  useEffect(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (category) p.set("categorie", category);
    if (sort !== "nom") p.set("tri", sort);
    if (view === "list") p.set("vue", "liste");
    if (inStock) p.set("stock", "1");
    if (type !== "all") p.set("type", type);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, category, sort, view, inStock, type, min, max]);


  const activeCount = [category, query.trim(), inStock, type !== "all", min, max].filter(Boolean).length;

  function reset() {
    setQuery("");
    setCategory(null);
    setInStock(false);
    setType("all");
    setMin("");
    setMax("");
  }

  const chips: { label: string; clear: () => void }[] = [];
  if (query.trim()) chips.push({ label: `« ${query.trim()} »`, clear: () => setQuery("") });
  if (category) chips.push({ label: categories.find((c) => c.id === category)?.name ?? "Catégorie", clear: () => setCategory(null) });
  if (inStock) chips.push({ label: "En stock", clear: () => setInStock(false) });
  if (type !== "all") chips.push({ label: type === "frais" ? "Produits frais" : "Stockables", clear: () => setType("all") });
  if (min || max) chips.push({ label: `Prix ${min || 0} – ${max || "∞"} F`, clear: () => (setMin(""), setMax("")) });

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
  const title = "text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2";

  const renderFilters = (scope: string) => (
    <div className="grid gap-6">
      <div>
        <p className={title}>Recherche</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom du produit…" className={`${input} mt-2`} />
      </div>

      <div>
        <p className={title}>Catégories</p>
        <ul className="mt-2 grid gap-0.5">
          <li>
            <button type="button" onClick={() => setCategory(null)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${!category ? "bg-brand-soft font-bold text-brand" : "hover:bg-surface-2"}`}>
              Tous <span className="font-mono text-xs">{products.length}</span>
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setCategory(c.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${category === c.id ? "bg-brand-soft font-bold text-brand" : "hover:bg-surface-2"}`}>
                {c.name} <span className="font-mono text-xs">{c.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className={title}>Prix du marché (FCFA)</p>
        <div className="mt-2 flex items-center gap-2">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={bounds ? String(bounds.lo) : "Min"} aria-label="Prix minimum" className={input} />
          <span className="text-ink-2">–</span>
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={bounds ? String(bounds.hi) : "Max"} aria-label="Prix maximum" className={input} />
        </div>
        {currency !== "XOF" && <p className="mt-1.5 text-[11px] text-ink-2">Les filtres de prix se saisissent en FCFA.</p>}
      </div>

      <div>
        <p className={title}>Disponibilité</p>
        <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
          En stock uniquement
        </label>
      </div>

      <div>
        <p className={title}>Type de produit</p>
        <div className="mt-2 grid gap-1.5 text-sm">
          {(
            [
              { v: "all", l: "Tous" },
              { v: "frais", l: "Produits frais" },
              { v: "stockable", l: "Stockables (dépôt possible)" },
            ] as const
          ).map((o) => (
            <label key={o.v} className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name={`type-${scope}`} checked={type === o.v} onChange={() => setType(o.v)} className="size-4 accent-[var(--color-brand)]" />
              {o.l}
            </label>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button type="button" onClick={reset} className="rounded-xl border border-line py-2.5 text-sm font-bold hover:bg-surface-2">
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  const viewBtn = (v: "grid" | "list", label: string, path: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-label={label}
      aria-pressed={view === v}
      className={`grid size-9 place-items-center rounded-lg ${view === v ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"}`}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24 lg:block">{renderFilters("side")}</aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filtres{activeCount > 0 && ` (${activeCount})`}
            </button>
            <p className="text-sm text-ink-2">
              <span className="font-bold text-ink">{filtered.length}</span> produit{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-ink-2 sm:inline">Trier par</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm font-semibold outline-none focus:border-brand">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden gap-1 sm:flex">
              {viewBtn("grid", "Vue en grille", <><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" /></>)}
              {viewBtn("list", "Vue en liste", <path d="M4 7h16M4 12h16M4 17h16" />)}
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button key={c.label} type="button" onClick={c.clear} className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                {c.label}
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ))}
            <button type="button" onClick={reset} className="text-xs font-semibold text-ink-2 underline">
              Tout effacer
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-12 text-center">
            <p className="font-display text-lg font-extrabold">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-ink-2">Essayez d&apos;élargir votre recherche ou de retirer un filtre.</p>
            <button type="button" onClick={reset} className="mt-5 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className={view === "list" ? "mt-4 grid gap-3" : "mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3"}>
              {filtered.slice(0, visible).map((p) => (
                <ProductCard key={p.id} product={p} price={prices.get(p.id)} layout={view === "list" ? "list" : "grid"} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-8 text-center">
                <button type="button" onClick={() => setVisible((v) => v + STEP)} className="rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app">
                  Afficher plus ({filtered.length - visible} restants)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filtres en panneau sur mobile */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${filtersOpen ? "" : "pointer-events-none"}`} aria-hidden={!filtersOpen}>
        <div onClick={() => setFiltersOpen(false)} className={`absolute inset-0 bg-[#0b0d20]/55 transition-opacity ${filtersOpen ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-3xl bg-surface transition-transform duration-300 ${filtersOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="font-display text-lg font-extrabold">Filtres</p>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres" className="grid size-9 place-items-center rounded-full hover:bg-surface-2">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{renderFilters("sheet")}</div>
          <div className="border-t border-line p-4">
            <button type="button" onClick={() => setFiltersOpen(false)} className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand">
              Voir {filtered.length} produit{filtered.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
