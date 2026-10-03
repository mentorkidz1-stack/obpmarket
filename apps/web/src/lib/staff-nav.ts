/** Navigation du back-office : chaque page n'est proposée qu'aux rôles qui peuvent l'utiliser. */

export type BackofficeRole = "GESTIONNAIRE_PRIX" | "GESTIONNAIRE_LIQUIDITE" | "MODERATEUR" | "AGENT_MAGASIN" | "ADMIN";

export const ALL_STAFF_ROLES: BackofficeRole[] = ["GESTIONNAIRE_PRIX", "GESTIONNAIRE_LIQUIDITE", "MODERATEUR", "AGENT_MAGASIN", "ADMIN"];

export const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  AGENT: "Agent de terrain",
  AGENT_MAGASIN: "Agent magasin",
  GESTIONNAIRE_PRIX: "Gestionnaire des prix",
  GESTIONNAIRE_LIQUIDITE: "Gestionnaire liquidité",
  MODERATEUR: "Modérateur",
  ADMIN: "Administrateur",
};

const PRIX: BackofficeRole[] = ["GESTIONNAIRE_PRIX", "ADMIN"];
const LIQ: BackofficeRole[] = ["GESTIONNAIRE_LIQUIDITE", "ADMIN"];
const MOD: BackofficeRole[] = ["MODERATEUR", "ADMIN"];
const STORE: BackofficeRole[] = ["GESTIONNAIRE_LIQUIDITE", "AGENT_MAGASIN", "ADMIN"];

export interface NavItem {
  href: string;
  label: string;
  roles: BackofficeRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Prix",
    items: [
      { href: "/backoffice/releves", label: "Relevés à valider", roles: PRIX },
      { href: "/backoffice/marches", label: "Marchés et agents", roles: PRIX },
      { href: "/backoffice/catalogue", label: "Catalogue", roles: PRIX },
      { href: "/backoffice/produits", label: "Photos des produits", roles: PRIX },
    ],
  },
  {
    label: "Ventes",
    items: [
      { href: "/backoffice/commandes", label: "Commandes", roles: LIQ },
      { href: "/backoffice/paiements", label: "Paiements à vérifier", roles: LIQ },
      { href: "/backoffice/retrait", label: "Retrait en magasin", roles: STORE },
      { href: "/backoffice/stock", label: "Stock", roles: STORE },
      { href: "/backoffice/depots", label: "Dépôts et livraison", roles: LIQ },
      { href: "/backoffice/retraits", label: "Retraits à verser", roles: LIQ },
      { href: "/backoffice/liquidite", label: "Demandes de liquidité", roles: LIQ },
      { href: "/backoffice/clients", label: "Clients", roles: LIQ },
    ],
  },
  {
    label: "Contenu",
    items: [
      { href: "/backoffice/vendeurs", label: "Vendeurs et annonces", roles: MOD },
      { href: "/backoffice/immobilier", label: "Immobilier", roles: MOD },
      { href: "/backoffice/bannieres", label: "Bannières", roles: MOD },
      { href: "/backoffice/messages", label: "Messages", roles: MOD },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/backoffice/equipe", label: "Équipe et accès", roles: ["ADMIN"] },
      { href: "/backoffice/journal", label: "Journal d'activité", roles: ["ADMIN"] },
    ],
  },
];

export function navFor(role: string): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role as BackofficeRole)) })).filter((g) => g.items.length > 0);
}
