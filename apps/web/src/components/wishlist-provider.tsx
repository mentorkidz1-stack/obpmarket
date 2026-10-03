"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface WishlistState {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistState | null>(null);
const STORAGE_KEY = "obp-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation depuis localStorage, absent côté serveur
      if (raw) setIds((JSON.parse(raw) as unknown[]).filter((v): v is string => typeof v === "string"));
    } catch {
      // favoris vides si le stockage est indisponible
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignoré
    }
  }, [ids, ready]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  /** Renvoie true si le produit vient d'être ajouté, false s'il vient d'être retiré. */
  const toggle = useCallback(
    (id: string) => {
      const adding = !ids.includes(id);
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
      return adding;
    },
    [ids],
  );

  const value = useMemo(() => ({ ids, has, toggle }), [ids, has, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist doit être utilisé dans <WishlistProvider>.");
  return ctx;
}
