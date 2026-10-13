/**
 * Informations publiques du site. OBP Market est un service de ONE BUILD PLUS GROUPE (OBP).
 * Les valeurs par défaut sont celles de la société ; chacune peut être remplacée par une variable d'environnement
 * (voir apps/web/.env.example). Un champ vide n'est pas affiché.
 */
export const SITE = {
  name: "OBP Market",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://obpmarket.vercel.app").replace(/\/$/, ""),
  tagline: "Des prix accessibles, pour tous.",
  description:
    "OBP Market : produits agricoles, vivriers et électroménagers à prix accessibles, vendus par OBP et ses partenaires, avec retrait au magasin ou livraison au Bénin. Parcelles, maisons, chambres et guest houses proposés par OBP.",
  company: {
    legalName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "ONE BUILD PLUS GROUPE",
    shortName: "OBP",
    ifu: process.env.NEXT_PUBLIC_COMPANY_IFU ?? "3202683256845",
  },
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP ?? "2290197377118").replace(/\D/g, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+229 01 97 37 71 18",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "Parcelle M, Maison Assiba, Bokpè, Agori, Abomey-Calavi (Bénin)",
};
