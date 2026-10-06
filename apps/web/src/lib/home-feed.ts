import { parseProductPhotos, type Product, type Property, type ReferencePrice } from "@/lib/api";

export interface GalleryTile {
  key: string;
  src: string;
  alt: string;
  href: string;
  label: string;
  tag: string;
}

export const GALLERY_MAX = 50;

/** Visuels de la boutique (marchés, producteurs, dépôts, paiement mobile) glissés dans la galerie. */
const EXTRA_TILES: GalleryTile[] = [
  { key: "x-marche", src: "/promos/hero-1.jpg", alt: "Étal de tomates et de piments sur un marché du Bénin", href: "/boutique", label: "Tomates et piments du marché", tag: "Marchés" },
  { key: "x-producteur", src: "/promos/hero-2.jpg", alt: "Producteur dans son champ de haricots", href: "/vendeur", label: "Nos producteurs partenaires", tag: "Producteurs" },
  { key: "x-fruits", src: "/promos/hero-3.jpg", alt: "Étal de pastèques, mangues et ananas", href: "/boutique", label: "Fruits de saison", tag: "Marchés" },
  { key: "x-depot", src: "/promos/promo-depot.jpg", alt: "Sacs de marchandises empilés dans un dépôt", href: "/comment-ca-marche", label: "Vos produits en sécurité dans nos dépôts", tag: "Dépôts" },
  { key: "x-paiement", src: "/promos/promo-paiement.jpg", alt: "Cliente qui paie avec son téléphone", href: "/comment-ca-marche", label: "Paiement Mobile Money", tag: "Paiement" },
  { key: "x-vendeur", src: "/promos/promo-vendeur.jpg", alt: "Vendeuse de bananes plantains", href: "/vendeur", label: "Devenir vendeur partenaire", tag: "Vendeurs" },
];

/**
 * Galerie « En images » de l'accueil : toutes les photos réelles du catalogue (chaque photo de chaque bien, et celle de
 * chaque produit), mélangées, avec les visuels de la boutique intercalés. Chaque image mène à sa fiche ou à sa page.
 * Elle grandit toute seule quand on ajoute des produits ou des photos, jusqu'à GALLERY_MAX images.
 */
export function buildGallery(products: Product[], properties: Property[], typeLabel: (p: Property) => string): GalleryTile[] {
  const houses: GalleryTile[] = properties.flatMap((p) =>
    parseProductPhotos(p).map((src, i) => ({
      key: `h-${p.id}-${i}`,
      src,
      alt: `${p.title}, photo ${i + 1}`,
      href: `/immobilier/${p.id}`,
      label: p.title,
      tag: typeLabel(p),
    })),
  );
  const goods: GalleryTile[] = products.flatMap((p) =>
    parseProductPhotos(p).map((src, i) => ({
      key: `p-${p.id}-${i}`,
      src,
      alt: `${p.name}, photo ${i + 1}`,
      href: `/produits/${p.id}`,
      label: p.name,
      tag: p.category.name,
    })),
  );

  const every = Math.max(2, Math.floor(houses.length / Math.max(goods.length, 1)));
  const tiles: GalleryTile[] = [];
  let g = 0;
  houses.forEach((tile, i) => {
    tiles.push(tile);
    if ((i + 1) % every === 0 && g < goods.length) tiles.push(goods[g++]);
  });
  const all = [...tiles, ...goods.slice(g)];

  // Les visuels de la boutique s'intercalent régulièrement ; la galerie ne dépasse jamais GALLERY_MAX images.
  const gap = Math.max(3, Math.floor(all.length / (EXTRA_TILES.length + 1)));
  const withExtras: GalleryTile[] = [];
  let e = 0;
  all.forEach((tile, i) => {
    withExtras.push(tile);
    if ((i + 1) % gap === 0 && e < EXTRA_TILES.length) withExtras.push(EXTRA_TILES[e++]);
  });
  withExtras.push(...EXTRA_TILES.slice(e));
  return withExtras.slice(0, GALLERY_MAX);
}

export type FeedItem = { kind: "product"; product: Product; price: ReferencePrice } | { kind: "property"; property: Property };

/**
 * Grille « À la une » de l'accueil : produits et biens immobiliers mélangés, pour que ni les uns ni les autres
 * ne passent en premier. Un bien tous les trois éléments ; les produits viennent de toutes les catégories à tour
 * de rôle (un céréale, un tubercule, une huile…), en commençant par ceux qui ont une photo et du stock.
 */
export function buildHomeFeed(products: Product[], prices: Map<string, ReferencePrice>, properties: Property[], total = 12): FeedItem[] {
  const sellable = products.filter((p) => prices.has(p.id) && p.stockQuantity > 0);

  const byCategory = new Map<string, Product[]>();
  for (const p of sellable) byCategory.set(p.category.name, [...(byCategory.get(p.category.name) ?? []), p]);
  const queues = [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "fr"))
    .map(([, list]) => list.sort((a, b) => Number(parseProductPhotos(b).length > 0) - Number(parseProductPhotos(a).length > 0)));

  // Un tour par catégorie, puis on recommence : les premiers produits de l'accueil sont donc tous différents.
  const productOrder: Product[] = [];
  for (let round = 0; queues.some((q) => q[round]); round++) {
    for (const q of queues) if (q[round]) productOrder.push(q[round]);
  }

  // Biens disponibles d'abord, puis ceux « à la une » ; l'API les renvoie déjà du plus récent au plus ancien.
  const propertyOrder = [...properties].sort(
    (a, b) => Number(a.status !== "DISPONIBLE") - Number(b.status !== "DISPONIBLE") || Number(b.featured) - Number(a.featured),
  );

  // Jamais plus d'un bien pour deux produits : avec un petit catalogue, les biens ne doivent pas prendre toute la grille.
  const maxProperties = Math.min(propertyOrder.length, Math.ceil(productOrder.length / 2), Math.floor(total / 3));
  let size = Math.min(total, productOrder.length + maxProperties);
  // Rangées complètes sur ordinateur (4 colonnes), sans case vide en fin de grille.
  if (size > 4) size -= size % 4;

  const feed: FeedItem[] = [];
  let pi = 0;
  let hi = 0;
  for (let i = 0; i < size; i++) {
    const wantsProperty = i % 3 === 2;
    if ((wantsProperty && hi < maxProperties) || pi >= productOrder.length) {
      if (hi >= maxProperties) break;
      feed.push({ kind: "property", property: propertyOrder[hi++] });
    } else {
      const product = productOrder[pi++];
      feed.push({ kind: "product", product, price: prices.get(product.id)! });
    }
  }
  return feed;
}
