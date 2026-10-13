/**
 * Totaux d'un panier : les prix des produits sont hors taxe, chaque produit a son taux de TVA (ou le taux par défaut,
 * ou 0 s'il est exonéré). Le montant à payer est toujours le total toutes taxes comprises (TTC).
 */
export interface CartTotals {
  /** Total hors taxe. */
  ht: number;
  /** TVA totale. */
  vat: number;
  /** Total toutes taxes comprises (HT + TVA). */
  ttc: number;
  /** Vrai quand au moins un produit n'a pas encore de prix publié (le total est alors incomplet). */
  incomplete: boolean;
}

export function cartTotals(
  lines: Array<{ product: { id: string; vatRate?: number | null }; quantity: number }>,
  prices: Map<string, { value: number }>,
  rateFor: (product: { vatRate?: number | null }) => number,
): CartTotals {
  let ht = 0;
  let vat = 0;
  let incomplete = false;
  for (const l of lines) {
    const price = prices.get(l.product.id);
    if (!price) {
      incomplete = true;
      continue;
    }
    const lineHt = price.value * l.quantity;
    ht += lineHt;
    vat += (lineHt * rateFor(l.product)) / 100;
  }
  return { ht, vat, ttc: ht + vat, incomplete };
}
