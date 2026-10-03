"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Money } from "@/components/money";
import { ProductImage } from "@/components/product-image";
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
  const { products, prices } = useCatalog(focused);

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
          {suggestions.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-2">Aucun produit ne correspond à « {query.trim()} ».</p>
          ) : (
            <>
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
              <button type="submit" className="w-full border-t border-line px-4 py-3 text-left text-sm font-bold text-brand hover:bg-surface-2">
                Voir tous les résultats →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
