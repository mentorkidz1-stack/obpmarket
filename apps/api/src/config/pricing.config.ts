/**
 * Seuils du calcul de prix moyen — cahier des charges §5 (RG-01, RG-03) et §4.2 (PRI-02, PRI-03).
 * Lus depuis l'environnement pour rester paramétrables sans redéploiement (BO-08).
 */
export interface PricingConfig {
  /** Fenêtre glissante des relevés pris en compte pour la moyenne (RG-01). */
  windowHours: number;
  /** Nombre minimal de relevés valides requis avant de publier un prix (RG-03). */
  minReadings: number;
  /** Nombre minimal de marchés distincts requis avant de publier un prix (RG-03). */
  minMarkets: number;
  /** Écart relatif au-delà duquel un relevé est mis de côté pour contrôle (PRI-02). */
  anomalyThreshold: number;
}

export function loadPricingConfig(): PricingConfig {
  return {
    windowHours: Number(process.env.PRICE_WINDOW_HOURS ?? 24),
    minReadings: Number(process.env.PRICE_MIN_READINGS ?? 3),
    minMarkets: Number(process.env.PRICE_MIN_MARKETS ?? 2),
    anomalyThreshold: Number(process.env.PRICE_ANOMALY_THRESHOLD ?? 0.15),
  };
}
