"use client";

import { useCurrency } from "@/components/currency-provider";

/** Montant FCFA affiché dans la devise choisie par le visiteur (« ≈ » quand il est converti). */
export function Money({ value, unitClassName = "" }: { value: number; unitClassName?: string }) {
  const { format } = useCurrency();
  const { amount, symbol, converted } = format(value);
  return (
    <>
      {converted && <span className="font-semibold text-ink-2">≈ </span>}
      {amount} <small className={unitClassName}>{symbol}</small>
    </>
  );
}

/** Version texte, pour les cas où un composant n'est pas possible (attributs, chaînes). */
export function useMoneyText() {
  const { format } = useCurrency();
  return (value: number) => {
    const { amount, symbol, converted } = format(value);
    return `${converted ? "≈ " : ""}${amount} ${symbol}`;
  };
}
