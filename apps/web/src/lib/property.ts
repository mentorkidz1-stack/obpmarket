import type { AreaUnit, Property, PropertyKind, PropertyStatus, PropertyType, RentPeriod } from "@/lib/api";

export const PROPERTY_TYPES: { value: PropertyType; label: string; plural: string }[] = [
  { value: "PARCELLE", label: "Parcelle", plural: "Parcelles" },
  { value: "TERRAIN_AGRICOLE", label: "Terrain agricole", plural: "Terrains agricoles" },
  { value: "MAISON", label: "Maison / villa", plural: "Maisons et villas" },
  { value: "APPARTEMENT", label: "Appartement", plural: "Appartements" },
  { value: "CHAMBRE", label: "Chambre", plural: "Chambres" },
  { value: "GUEST_HOUSE", label: "Guest house", plural: "Guest houses" },
  { value: "LOCAL_COMMERCIAL", label: "Local commercial", plural: "Locaux commerciaux" },
];

export const typeLabel = (t: PropertyType) => PROPERTY_TYPES.find((x) => x.value === t)?.label ?? t;

export const KIND_LABEL: Record<PropertyKind, string> = { VENTE: "À vendre", LOCATION: "À louer" };

export const AREA_UNITS: { value: AreaUnit; label: string }[] = [
  { value: "M2", label: "m²" },
  { value: "ARE", label: "are(s)" },
  { value: "HECTARE", label: "hectare(s)" },
];

export const RENT_PERIODS: { value: RentPeriod; label: string; short: string }[] = [
  { value: "NUIT", label: "par nuit", short: "/ nuit" },
  { value: "MOIS", label: "par mois", short: "/ mois" },
  { value: "AN", label: "par an", short: "/ an" },
];

export const rentShort = (p: RentPeriod | null) => RENT_PERIODS.find((r) => r.value === p)?.short ?? "";

export function statusLabel(status: PropertyStatus, kind: PropertyKind): string {
  if (status === "DISPONIBLE") return "Disponible";
  if (status === "RESERVE") return "Réservé";
  return kind === "VENTE" ? "Vendu" : "Loué";
}

const nf = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);

/** Superficie telle que saisie par OBP (« 1 hectare », « 500 m² »). */
export function formatArea(value: number | null, unit: AreaUnit): string | null {
  if (value == null) return null;
  if (unit === "M2") return `${nf(value)} m²`;
  if (unit === "ARE") return `${nf(value)} are${value > 1 ? "s" : ""}`;
  return `${nf(value)} hectare${value > 1 ? "s" : ""}`;
}

/** Équivalent en m² quand la superficie n'est pas saisie en m². */
export function areaEquivalent(p: Pick<Property, "areaUnit" | "areaM2">): string | null {
  return p.areaUnit !== "M2" && p.areaM2 != null ? `≈ ${nf(p.areaM2)} m²` : null;
}
