/**
 * Produits d'EXEMPLE pour étoffer le catalogue (photos libres de droits dans apps/web/public/produits).
 *
 *   npm run seed:catalog     → crée les produits d'exemple qui n'existent pas encore (rejouable)
 *   npm run unseed:catalog   → les supprime (avant d'ajouter les vrais produits)
 *
 * Les PRIX sont des valeurs de démonstration, comme ceux du jeu de données initial : trois relevés d'un agent de
 * démonstration et un historique fictif sur 30 jours. Les vrais prix viendront des relevés des agents de terrain
 * (le prix de référence se recalcule à chaque relevé). Les quantités en stock sont fictives aussi.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Sample = {
  name: string;
  category: string;
  unitLabel: string;
  perishable?: boolean;
  /** Stocké chez OBP (donc éligible au dépôt s'il n'est pas périssable). */
  stockable?: boolean;
  price: number;
  stock: number;
  photo: string;
};

const FRESH = { perishable: true, stockable: false } as const;
const DRY = { perishable: false, stockable: true } as const;

const SAMPLES: Sample[] = [
  // Céréales et légumineuses
  { name: 'Mil', category: 'Céréales', unitLabel: 'sac 100 kg', ...DRY, price: 42000, stock: 22, photo: 'mil' },
  { name: 'Sorgho', category: 'Céréales', unitLabel: 'sac 100 kg', ...DRY, price: 36500, stock: 20, photo: 'sorgho' },
  { name: 'Soja', category: 'Céréales', unitLabel: 'sac 100 kg', ...DRY, price: 56000, stock: 15, photo: 'soja' },
  { name: 'Arachide décortiquée', category: 'Céréales', unitLabel: 'sac 50 kg', ...DRY, price: 39000, stock: 24, photo: 'arachide' },
  // Tubercules
  { name: 'Igname', category: 'Tubercules', unitLabel: 'sac 50 kg', ...DRY, price: 27500, stock: 28, photo: 'igname' },
  { name: 'Manioc frais', category: 'Tubercules', unitLabel: 'sac 50 kg', ...FRESH, price: 8500, stock: 14, photo: 'manioc' },
  { name: 'Patate douce', category: 'Tubercules', unitLabel: 'sac 50 kg', ...FRESH, price: 15000, stock: 12, photo: 'patate-douce' },
  { name: 'Taro (macabo)', category: 'Tubercules', unitLabel: 'sac 50 kg', ...DRY, price: 21000, stock: 10, photo: 'taro' },
  // Légumes
  { name: 'Oignon', category: 'Légumes', unitLabel: 'sac 25 kg', ...FRESH, price: 14500, stock: 20, photo: 'oignon' },
  { name: 'Piment frais', category: 'Légumes', unitLabel: 'panier 10 kg', ...FRESH, price: 11500, stock: 14, photo: 'piment' },
  { name: 'Gombo', category: 'Légumes', unitLabel: 'panier 10 kg', ...FRESH, price: 6800, stock: 12, photo: 'gombo' },
  { name: 'Aubergine', category: 'Légumes', unitLabel: 'panier 15 kg', ...FRESH, price: 7200, stock: 12, photo: 'aubergine' },
  { name: 'Carotte', category: 'Légumes', unitLabel: 'sac 25 kg', ...FRESH, price: 12500, stock: 15, photo: 'carotte' },
  { name: 'Chou', category: 'Légumes', unitLabel: 'sac 20 kg', ...FRESH, price: 9500, stock: 12, photo: 'chou' },
  { name: 'Poivron', category: 'Légumes', unitLabel: 'panier 10 kg', ...FRESH, price: 12500, stock: 10, photo: 'poivron' },
  { name: 'Concombre', category: 'Légumes', unitLabel: 'panier 20 kg', ...FRESH, price: 8500, stock: 12, photo: 'concombre' },
  // Fruits
  { name: 'Ananas', category: 'Fruits', unitLabel: 'cageot 12 pièces', ...FRESH, price: 9500, stock: 16, photo: 'ananas' },
  { name: 'Banane plantain', category: 'Fruits', unitLabel: 'régime', ...FRESH, price: 5500, stock: 30, photo: 'plantain' },
  { name: 'Mangue', category: 'Fruits', unitLabel: 'panier 20 kg', ...FRESH, price: 11500, stock: 14, photo: 'mangue' },
  { name: 'Orange', category: 'Fruits', unitLabel: 'sac 50 kg', ...FRESH, price: 17000, stock: 18, photo: 'orange' },
  { name: 'Pastèque', category: 'Fruits', unitLabel: 'pièce', ...FRESH, price: 2500, stock: 40, photo: 'pasteque' },
  { name: 'Papaye', category: 'Fruits', unitLabel: 'panier 20 kg', ...FRESH, price: 8200, stock: 12, photo: 'papaye' },
  { name: 'Banane douce', category: 'Fruits', unitLabel: 'régime', ...FRESH, price: 4500, stock: 25, photo: 'banane-douce' },
  { name: 'Noix de coco', category: 'Fruits', unitLabel: 'sac 50 pièces', ...DRY, price: 17500, stock: 10, photo: 'noix-de-coco' },
  // Huiles et corps gras
  { name: "Huile d'arachide", category: 'Huiles', unitLabel: 'bidon 20 L', ...DRY, price: 35000, stock: 18, photo: 'huile-arachide' },
  { name: 'Huile végétale', category: 'Huiles', unitLabel: 'bidon 20 L', ...DRY, price: 29500, stock: 22, photo: 'huile-vegetale' },
  { name: 'Beurre de karité', category: 'Huiles', unitLabel: 'seau 10 kg', ...DRY, price: 25000, stock: 12, photo: 'beurre-de-karite' },
  // Épicerie
  { name: 'Sucre', category: 'Épicerie', unitLabel: 'sac 50 kg', ...DRY, price: 31500, stock: 25, photo: 'sucre' },
  { name: 'Farine de blé', category: 'Épicerie', unitLabel: 'sac 50 kg', ...DRY, price: 26500, stock: 20, photo: 'farine-de-ble' },
  { name: 'Tomate concentrée', category: 'Épicerie', unitLabel: 'carton 24 boîtes', ...DRY, price: 16500, stock: 30, photo: 'tomate-concentree' },
  { name: 'Spaghetti', category: 'Épicerie', unitLabel: 'carton 20 paquets', ...DRY, price: 9800, stock: 35, photo: 'spaghetti' },
  // Électroménager
  { name: 'Réfrigérateur double porte', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 485000, stock: 6, photo: 'refrigerateur' },
  { name: 'Congélateur coffre 300 L', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 235000, stock: 5, photo: 'congelateur' },
  { name: 'Machine à laver 7 kg', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 295000, stock: 6, photo: 'machine-a-laver' },
  { name: 'Mixeur 1,5 L', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 28500, stock: 20, photo: 'mixeur' },
  { name: 'Ventilateur sur pied', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 24500, stock: 18, photo: 'ventilateur' },
  { name: 'Climatiseur split 1,5 CV', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 265000, stock: 7, photo: 'climatiseur' },
  { name: 'Téléviseur LED 43 pouces', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 195000, stock: 8, photo: 'television' },
  { name: 'Four à micro-ondes 25 L', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 85000, stock: 10, photo: 'micro-ondes' },
  { name: 'Bouilloire en inox', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 14500, stock: 25, photo: 'bouilloire' },
  { name: 'Fer à repasser vapeur', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 12500, stock: 25, photo: 'fer-a-repasser' },
  { name: 'Cuisinière à gaz 4 feux', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 115000, stock: 8, photo: 'cuisiniere-a-gaz' },
  { name: 'Cuiseur à riz 1,8 L', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 32000, stock: 15, photo: 'cuiseur-a-riz' },
  { name: 'Grille-pain 2 fentes', category: 'Électroménager', unitLabel: 'pièce', ...DRY, price: 18500, stock: 15, photo: 'grille-pain' },
];

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const mode = process.argv[2];

  if (mode === 'remove') {
    let removed = 0;
    let kept = 0;
    for (const s of SAMPLES) {
      const product = await prisma.product.findUnique({ where: { name_unitLabel: { name: s.name, unitLabel: s.unitLabel } } });
      if (!product) continue;
      const used = (await prisma.orderItem.count({ where: { productId: product.id } })) + (await prisma.stockHolding.count({ where: { productId: product.id } })) + (await prisma.vendorListing.count({ where: { productId: product.id } }));
      if (used > 0) {
        kept++;
        console.log(`conservé (déjà commandé ou en stock client) : ${s.name}`);
        continue;
      }
      await prisma.priceAlert.deleteMany({ where: { productId: product.id } });
      await prisma.priceReading.deleteMany({ where: { productId: product.id } });
      await prisma.referencePrice.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
      removed++;
    }
    console.log(`${removed} produit(s) d'exemple supprimé(s), ${kept} conservé(s).`);
    return;
  }

  const markets = await prisma.market.findMany({ orderBy: { name: 'asc' } });
  const wanted = ['Dantokpa', 'Ouando', 'Bohicon'];
  const readingMarkets = wanted.map((n) => markets.find((m) => m.name === n)).filter((m): m is NonNullable<typeof m> => !!m);
  if (readingMarkets.length < 3) throw new Error('Les marchés de démonstration (Dantokpa, Ouando, Bohicon) sont introuvables : lancez d\'abord `npm run seed`.');
  const agent = await prisma.user.findUnique({ where: { phone: '+22901000001' } });
  if (!agent) throw new Error("L'agent de démonstration (+22901000001) est introuvable : lancez d'abord `npm run seed`.");

  const categories = new Map<string, string>();
  for (const name of new Set(SAMPLES.map((s) => s.category))) {
    const c = await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
    categories.set(name, c.id);
  }

  let created = 0;
  for (const s of SAMPLES) {
    const existing = await prisma.product.findUnique({ where: { name_unitLabel: { name: s.name, unitLabel: s.unitLabel } } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        name: s.name,
        unitLabel: s.unitLabel,
        isPerishable: s.perishable ?? false,
        isStockable: s.stockable ?? false,
        stockQuantity: s.stock,
        categoryId: categories.get(s.category)!,
        photos: JSON.stringify([`/produits/${s.photo}.jpg`]),
      },
    });

    // Trois relevés de démonstration (un par marché) : le prix de référence existe tout de suite.
    const prices: number[] = [];
    for (const market of readingMarkets) {
      const price = Math.round(s.price + (Math.random() - 0.5) * 0.03 * s.price);
      prices.push(price);
      await prisma.priceReading.create({ data: { productId: product.id, marketId: market.id, agentId: agent.id, price } });
    }

    // Historique fictif sur 30 jours pour que le graphique de la fiche ne soit pas vide.
    let walking = s.price * (0.94 + Math.random() * 0.06);
    const history = [];
    for (let d = 30; d >= 1; d--) {
      walking *= 1 + (Math.random() - 0.48) * 0.025;
      history.push({ productId: product.id, value: Math.round(walking), readingsCount: 3, marketsCount: 3, windowHours: 24, computedAt: new Date(Date.now() - d * DAY) });
    }
    await prisma.referencePrice.createMany({ data: history });
    await prisma.referencePrice.create({
      data: { productId: product.id, value: prices.reduce((a, b) => a + b, 0) / prices.length, readingsCount: prices.length, marketsCount: 3, windowHours: 24 },
    });
    created++;
  }

  console.log(`${created} produit(s) d'exemple créé(s) (${SAMPLES.length - created} existaient déjà).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
