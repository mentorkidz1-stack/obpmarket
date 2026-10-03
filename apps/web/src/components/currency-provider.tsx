"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getExchangeRates, type ExchangeRates } from "@/lib/api";

export type Currency = "XOF" | "EUR" | "USD" | "NGN" | "GHS";

export const CURRENCIES: { code: Currency; label: string; symbol: string; decimals: number }[] = [
  { code: "XOF", label: "FCFA", symbol: "F", decimals: 0 },
  { code: "EUR", label: "Euro", symbol: "€", decimals: 2 },
  { code: "USD", label: "Dollar US", symbol: "$", decimals: 2 },
  { code: "NGN", label: "Naira", symbol: "₦", decimals: 0 },
  { code: "GHS", label: "Cedi", symbol: "GH₵", decimals: 2 },
];

const STORAGE_KEY = "obp-currency";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Convertit un montant FCFA dans la devise choisie et le formate — `converted` vaut false en FCFA. */
  format: (xof: number) => { amount: string; symbol: string; converted: boolean };
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStored(): Currency {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && CURRENCIES.some((c) => c.code === v)) return v as Currency;
  } catch {
    // stockage indisponible : on reste en FCFA
  }
  return "XOF";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("XOF");
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation depuis localStorage, absent côté serveur
    setCurrencyState(readStored());
  }, []);

  // Les taux ne sont nécessaires que si une autre devise que le FCFA est choisie.
  useEffect(() => {
    if (currency === "XOF" || rates) return;
    getExchangeRates().then(setRates).catch(() => {});
  }, [currency, rates]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignoré
    }
  }, []);

  const format = useCallback(
    (xof: number) => {
      const rate = currency === "XOF" || !rates ? null : rates.rates[currency];
      if (currency === "XOF" || rate == null) {
        return { amount: new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(xof)), symbol: "F", converted: false };
      }
      const meta = CURRENCIES.find((c) => c.code === currency)!;
      const amount = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      }).format(xof * rate);
      return { amount, symbol: meta.symbol, converted: true };
    },
    [currency, rates],
  );

  const value = useMemo(() => ({ currency, setCurrency, format }), [currency, setCurrency, format]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency doit être utilisé dans <CurrencyProvider>");
  return ctx;
}
