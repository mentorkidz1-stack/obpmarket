"use client";

import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/property-card";
import type { Property, PropertyKind, PropertyType } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/property";

type Sort = "recents" | "prix-asc" | "prix-desc" | "surface-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "recents", label: "Plus récents" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "surface-desc", label: "Plus grande superficie" },
];

const STEP = 12;

export interface PropertyInitial {
  kind?: string;
  type?: string;
  ville?: string;
}

/** Catalogue immobilier : vente / location, type de bien, ville, prix et superficie (comparée en m²). */
export function PropertyCatalog({ properties, initial }: { properties: Property[]; initial: PropertyInitial }) {
  const [kind, setKind] = useState<PropertyKind | "ALL">(initial.kind === "VENTE" || initial.kind === "LOCATION" ? initial.kind : "ALL");
  const [type, setType] = useState<PropertyType | "ALL">(PROPERTY_TYPES.some((t) => t.value === initial.type) ? (initial.type as PropertyType) : "ALL");
  const [city, setCity] = useState(initial.ville ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<Sort>("recents");
  const [shown, setShown] = useState({ key: "", count: STEP });

  const cities = useMemo(() => [...new Set(properties.map((p) => p.city))].sort((a, b) => a.localeCompare(b, "fr")), [properties]);
  const presentTypes = useMemo(() => new Set(properties.map((p) => p.type)), [properties]);

  const filtered = useMemo(() => {
    const lo = minPrice ? Number(minPrice) : null;
    const hi = maxPrice ? Number(maxPrice) : null;
    const aLo = minArea ? Number(minArea) : null;
    const aHi = maxArea ? Number(maxArea) : null;
    const list = properties.filter((p) => {
      if (kind !== "ALL" && p.kind !== kind) return false;
      if (type !== "ALL" && p.type !== type) return false;
      if (city && p.city !== city) return false;
      if (onlyAvailable && p.status !== "DISPONIBLE") return false;
      if (lo != null && p.price < lo) return false;
      if (hi != null && p.price > hi) return false;
      if ((aLo != null || aHi != null) && p.areaM2 == null) return false;
      if (aLo != null && p.areaM2! < aLo) return false;
      if (aHi != null && p.areaM2! > aHi) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "prix-asc") return a.price - b.price;
      if (sort === "prix-desc") return b.price - a.price;
      if (sort === "surface-desc") return (b.areaM2 ?? 0) - (a.areaM2 ?? 0);
      return Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt);
    });
  }, [properties, kind, type, city, onlyAvailable, minPrice, maxPrice, minArea, maxArea, sort]);

  const filterKey = [kind, type, city, onlyAvailable, minPrice, maxPrice, minArea, maxArea, sort].join("|");
  const visible = shown.key === filterKey ? shown.count : STEP;

  const activeCount = [kind !== "ALL", type !== "ALL", city, onlyAvailable, minPrice, maxPrice, minArea, maxArea].filter(Boolean).length;
  const reset = () => {
    setKind("ALL");
    setType("ALL");
    setCity("");
    setOnlyAvailable(false);
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
  };

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
  const label = "text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2";
  const tab = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${active ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"}`;

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1 sm:max-w-sm" role="tablist">
          {(
            [
              { v: "ALL", l: "Tous" },
              { v: "VENTE", l: "À vendre" },
              { v: "LOCATION", l: "À louer" },
            ] as const
          ).map((o) => (
            <button key={o.v} type="button" role="tab" aria-selected={kind === o.v} onClick={() => setKind(o.v)} className={tab(kind === o.v)}>
              {o.l}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setType("ALL")}
            className={`shrink-0 rounded-lg border px-3.5 py-2 text-xs font-bold ${type === "ALL" ? "border-brand bg-brand text-on-brand" : "border-line text-ink-2 hover:text-ink"}`}
          >
            Tous les biens
          </button>
          {PROPERTY_TYPES.filter((t) => presentTypes.has(t.value) || type === t.value).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-xs font-bold ${type === t.value ? "border-brand bg-brand text-on-brand" : "border-line text-ink-2 hover:text-ink"}`}
            >
              {t.plural}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <span className={label}>Ville</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={input}>
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1.5">
            <span className={label}>Prix (FCFA)</span>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} placeholder="Min" aria-label="Prix minimum" className={input} />
              <span className="text-ink-2">–</span>
              <input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} placeholder="Max" aria-label="Prix maximum" className={input} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className={label}>Superficie (m²)</span>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={minArea} onChange={(e) => setMinArea(e.target.value.replace(/\D/g, ""))} placeholder="Min" aria-label="Superficie minimum" className={input} />
              <span className="text-ink-2">–</span>
              <input inputMode="numeric" value={maxArea} onChange={(e) => setMaxArea(e.target.value.replace(/\D/g, ""))} placeholder="Max" aria-label="Superficie maximum" className={input} />
            </div>
          </div>
          <label className="grid gap-1.5">
            <span className={label}>Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={input}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
            Biens disponibles uniquement
          </label>
          {activeCount > 0 && (
            <button type="button" onClick={reset} className="text-sm font-bold text-brand">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 text-sm text-ink-2">
        <span className="font-bold text-ink">{filtered.length}</span> bien{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-12 text-center">
          <p className="font-display text-lg font-extrabold">Aucun bien ne correspond</p>
          <p className="mt-1 text-sm text-ink-2">Élargissez votre recherche ou retirez un filtre.</p>
          <button type="button" onClick={reset} className="mt-5 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShown({ key: filterKey, count: visible + STEP })}
                className="rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app"
              >
                Afficher plus ({filtered.length - visible} restants)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
