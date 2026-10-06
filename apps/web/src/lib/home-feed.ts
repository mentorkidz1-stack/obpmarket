import { parseProductPhotos, type Product, type Property, type ReferencePrice } from "@/lib/api";

export type FeedItem = { kind: "product"; product: Product; price: ReferencePrice } | { kind: "property"; property: Property };

/**
 * Grille « À la une » de l'accueil : produits et biens immobiliers mélangés, pour que ni les uns ni les autres
 * ne passent en premier. Un bien tous les trois éléments ; les produits viennent de toutes les catégories à tour
 * de rôle (un céréale, un tubercule, une huile…), en commençant par ceux qui ont une photo et du stock.
 */
export function buildHomeFeed(products: Product[], prices: Map<string, ReferencePrice>, properties: Property[], total = 16): FeedItem[] {
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
