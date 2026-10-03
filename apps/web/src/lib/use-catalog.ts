"use client";

import { useEffect, useMemo, useState } from "react";
import { getLatestReferencePrices, getProducts, getProperties, type Product, type Property, type ReferencePrice } from "@/lib/api";

interface Catalog {
  products: Product[];
  prices: Map<string, ReferencePrice>;
  properties: Property[];
}

const TTL_MS = 60_000;
let cache: { at: number; data: Catalog } | null = null;
let inflight: Promise<Catalog> | null = null;

function load(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.data);
  inflight ??= Promise.all([getProducts(), getLatestReferencePrices(), getProperties().catch(() => [] as Property[])])
    .then(([products, prices, properties]) => {
      const data = { products, properties, prices: new Map(prices.map((p) => [p.productId, p])) };
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Catalogue (produits + derniers prix) partagé par le menu, la recherche, les favoris et le panier — un seul appel API par minute. */
export function useCatalog(enabled = true) {
  const [data, setData] = useState<Catalog | null>(cache?.data ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [enabled]);

  const categories = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of data.products) {
      const e = map.get(p.category.id);
      if (e) e.count += 1;
      else map.set(p.category.id, { id: p.category.id, name: p.category.name, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [data]);

  return { products: data?.products ?? [], properties: data?.properties ?? [], prices: data?.prices ?? new Map<string, ReferencePrice>(), categories, loaded: !!data, error };
}
