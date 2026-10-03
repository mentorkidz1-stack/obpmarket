/** Informations publiques du site. Les canaux de contact ne s'affichent que s'ils sont renseignés (variables d'environnement). */
export const SITE = {
  name: "OBP Market",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://obpmarket.vercel.app").replace(/\/$/, ""),
  tagline: "Le prix juste des marchés du Bénin, en ligne.",
  description:
    "OBP Market : prix moyen en temps réel des produits agricoles, vivriers et électroménagers au Bénin. Achetez, déposez en stock et revendez au prix du marché.",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "") ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "",
};
