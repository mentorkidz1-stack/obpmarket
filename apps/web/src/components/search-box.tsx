"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Money } from "@/components/money";
import { ProductImage } from "@/components/product-image";
import { Photo } from "@/components/photo";
import { parseProductPhotos } from "@/lib/api";
import { KIND_LABEL, typeLabel } from "@/lib/property";
import { useCatalog } from "@/lib/use-catalog";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Recherche avec suggestions en direct (produits réels du catalogue). */
export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const box = useRef<HTMLFormElement>(null);
  const { products, properties, prices } = useCatalog(focused);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const q = normalize(query.trim());
  const suggestions = useMemo(
    () => (q.length < 1 ? [] : products.filter((p) => normalize(p.name).includes(q) || normalize(p.category.name).includes(q)).slice(0, 5)),
    [products, q],
  );

  const propertyHits = useMemo(
    () =>
      q.length < 1
        ? []
        : properties
            .filter((p) => normalize(`${p.title} ${p.city} ${p.district ?? ""} ${typeLabel(p.type)}`).includes(q))
            .slice(0, 3),
    [properties, q],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFocused(false);
    const value = query.trim();
    router.push(value ? `/boutique?q=${encodeURIComponent(value)}` : "/boutique");
  }

  return (
    <form ref={box} onSubmit={submit} role="search" className={`relative ${className}`}>
      <div className="flex overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Rechercher un produit (maïs, riz, huile…)"
          aria-label="Rechercher un produit"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
        />
        <button type="submit" aria-label="Lancer la recherche" className="grid w-12 flex-none place-items-center bg-brand text-on-brand">
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4-4" />
          </svg>
        </button>
      </div>

      {focused && q.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_22px_50px_-18px_rgba(21,23,43,0.45)]">
          {suggestions.length === 0 && propertyHits.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-2">Aucun résultat pour « {query.trim()} ».</p>
          ) : (
            <>
              {suggestions.length > 0 && (
                <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Produits</p>
              )}
              <ul>
                {suggestions.map((p) => {
                  const price = prices.get(p.id);
                  return (
                    <li key={p.id}>
                      <Link href={`/produits/${p.id}`} onClick={() => setFocused(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2">
                        <ProductImage product={p} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{p.name}</p>
                          <p className="text-xs text-ink-2">{p.category.name}</p>
                        </div>
                        {price && (
                          <p className="flex-none font-display text-sm font-extrabold tabular-nums">
                            <Money value={price.value} unitClassName="text-xs text-ink-2" />
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {propertyHits.length > 0 && (
                <>
                  <p className="border-t border-line px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Immobilier</p>
                  <ul>
                    {propertyHits.map((p) => (
                      <li key={p.id}>
                        <Link href={`/immobilier/${p.id}`} onClick={() => setFocused(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2">
                          <span className="relative size-11 flex-none overflow-hidden rounded-xl bg-surface-2">
                            {parseProductPhotos(p)[0] && <Photo src={parseProductPhotos(p)[0]} alt="" sizes="44px" quality={60} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{p.title}</p>
                            <p className="truncate text-xs text-ink-2">
                              {KIND_LABEL[p.kind]} · {[p.district, p.city].filter(Boolean).join(", ")}
                            </p>
                          </div>
                          <p className="flex-none font-display text-sm font-extrabold tabular-nums">
                            <Money value={p.price} unitClassName="text-xs text-ink-2" />
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button type="submit" className="w-full border-t border-line px-4 py-3 text-left text-sm font-bold text-brand hover:bg-surface-2">
                Voir tous les produits →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
