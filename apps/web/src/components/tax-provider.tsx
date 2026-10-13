"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PublicSettings } from "@/lib/api";

export type TaxMode = "TTC" | "HT";

const STORAGE_KEY = "obp-tax-mode";

interface TaxContextValue {
  /** Vrai quand la TVA est active sur le site : sinon aucun choix « avec / hors taxe » n'est proposé. */
  enabled: boolean;
  /** Mode d'affichage choisi par le visiteur (TTC : avec taxe, HT : hors taxe). */
  mode: TaxMode;
  setMode: (m: TaxMode) => void;
  /** Taux de TVA par défaut du site, en %. */
  defaultRate: number;
  /** Taux appliqué à un produit : le sien s'il en a un (0 = exonéré), sinon le taux par défaut. */
  rateFor: (product?: { vatRate?: number | null } | null) => number;
  /** Prix hors taxe → prix à afficher selon le mode choisi. */
  show: (priceHT: number, product?: { vatRate?: number | null } | null) => number;
  /** « TTC » ou « HT » : mention à afficher à côté d'un prix ; vide si la TVA est désactivée. */
  label: string;
}

const FALLBACK: TaxContextValue = {
  enabled: false,
  mode: "HT",
  setMode: () => {},
  defaultRate: 0,
  rateFor: () => 0,
  show: (v) => v,
  label: "",
};

const TaxContext = createContext<TaxContextValue>(FALLBACK);

/**
 * Affichage des prix avec ou sans TVA. Les réglages (taux, mode par défaut) arrivent du serveur dès le premier rendu
 * pour éviter qu'un prix « saute » à l'écran ; le choix du visiteur est mémorisé sur son appareil.
 */
export function TaxProvider({ settings, children }: { settings: PublicSettings["vat"] | null; children: ReactNode }) {
  const enabled = !!settings?.enabled;
  const defaultMode: TaxMode = settings?.defaultDisplay === "HT" ? "HT" : "TTC";
  const [stored, setStored] = useState<TaxMode | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation depuis localStorage, absent côté serveur
      if (v === "TTC" || v === "HT") setStored(v);
    } catch {
      // stockage indisponible : on garde le mode par défaut
    }
  }, []);

  const setMode = useCallback((m: TaxMode) => {
    setStored(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignoré
    }
  }, []);

  const value = useMemo<TaxContextValue>(() => {
    const mode: TaxMode = enabled ? (stored ?? defaultMode) : "HT";
    const defaultRate = enabled ? (settings?.rate ?? 0) : 0;
    const rateFor = (product?: { vatRate?: number | null } | null) => (enabled ? (product?.vatRate ?? defaultRate) : 0);
    return {
      enabled,
      mode,
      setMode,
      defaultRate,
      rateFor,
      show: (priceHT, product) => (enabled && mode === "TTC" ? priceHT * (1 + rateFor(product) / 100) : priceHT),
      label: enabled ? mode : "",
    };
  }, [enabled, stored, defaultMode, settings?.rate, setMode]);

  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>;
}

export function useTax() {
  return useContext(TaxContext);
}
