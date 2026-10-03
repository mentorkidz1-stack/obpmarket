// @prisma/client s'expose en CommonJS ; import par défaut requis sous Node ESM strict.
import pkg from '@prisma/client';
const { PrismaClient, Role } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mot de passe de démonstration pour les comptes internes — docs/decisions/0006-connexion-interne.md.
// À NE JAMAIS GARDER sur une base en ligne : `npm run provision:staff -- --rotate-demo` le remplace par des mots de passe aléatoires.
const STAFF_DEMO_PASSWORD_HASH = bcrypt.hashSync('demo1234', 10);

const MARKETS = [
  { name: 'Dantokpa', city: 'Cotonou', latitude: 6.3654, longitude: 2.4328 },
  { name: 'Ouando', city: 'Porto-Novo', latitude: 6.4926, longitude: 2.6289 },
  { name: 'Bohicon', city: 'Bohicon', latitude: 7.1781, longitude: 2.0667 },
  { name: 'Parakou', city: 'Parakou', latitude: 9.3372, longitude: 2.6303 },
  { name: 'Glazoué', city: 'Glazoué', latitude: 7.9833, longitude: 2.3 },
];

const CATEGORIES = ['Céréales', 'Huiles', 'Tubercules', 'Légumes', 'Électroménager'];

const PRODUCTS: Array<{
  name: string;
  category: string;
  unitLabel: string;
  isPerishable: boolean;
  isStockable: boolean;
  samplePrice: number;
  stockQuantity: number;
}> = [
  { name: 'Maïs blanc', category: 'Céréales', unitLabel: 'sac 100 kg', isPerishable: false, isStockable: true, samplePrice: 38500, stockQuantity: 40 },
  { name: 'Riz local', category: 'Céréales', unitLabel: 'sac 50 kg', isPerishable: false, isStockable: true, samplePrice: 27800, stockQuantity: 55 },
  { name: 'Haricot niébé', category: 'Céréales', unitLabel: 'sac 100 kg', isPerishable: false, isStockable: true, samplePrice: 62000, stockQuantity: 18 },
  { name: 'Gari', category: 'Tubercules', unitLabel: 'sac 50 kg', isPerishable: false, isStockable: true, samplePrice: 21500, stockQuantity: 30 },
  { name: 'Huile de palme', category: 'Huiles', unitLabel: 'bidon 20 L', isPerishable: false, isStockable: true, samplePrice: 24000, stockQuantity: 25 },
  { name: 'Tomate fraîche', category: 'Légumes', unitLabel: 'panier 25 kg', isPerishable: true, isStockable: false, samplePrice: 12500, stockQuantity: 12 },
];

async function main() {
  const markets = await Promise.all(
    MARKETS.map((m) => prisma.market.upsert({ where: { name_city: { name: m.name, city: m.city } }, create: m, update: {} })),
  );

  const categories = await Promise.all(
    CATEGORIES.map((name) => prisma.category.upsert({ where: { name }, create: { name }, update: {} })),
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const agent = await prisma.user.upsert({
    where: { phone: '+22901000001' },
    create: { phone: '+22901000001', fullName: 'Agent Démo Dantokpa', role: Role.AGENT },
    update: {},
  });
  const STAFF = [
    {
      phone: '+22901000002',
      email: 'gestionnaire.prix@obpmarket.test',
      fullName: 'Aïcha Gomez — Gestionnaire prix',
      role: Role.GESTIONNAIRE_PRIX,
    },
    {
      phone: '+22901000003',
      email: 'gestionnaire.liquidite@obpmarket.test',
      fullName: 'Roland Houinsou — Gestionnaire liquidité',
      role: Role.GESTIONNAIRE_LIQUIDITE,
    },
    {
      phone: '+22901000004',
      email: 'moderatrice@obpmarket.test',
      fullName: 'Sandrine Dossa — Modératrice',
      role: Role.MODERATEUR,
    },
  ];
  for (const s of STAFF) {
    await prisma.user.upsert({
      where: { phone: s.phone },
      create: { ...s, passwordHash: STAFF_DEMO_PASSWORD_HASH },
      // update backfille l'e-mail et le rôle (un compte antérieur à 0006 pouvait n'avoir pas d'e-mail), mais ne touche
      // JAMAIS au mot de passe : relancer le seed ne doit pas rétablir « demo1234 » sur un compte déjà sécurisé.
      update: { email: s.email, fullName: s.fullName, role: s.role },
    });
  }
  await Promise.all(markets.map((m) => prisma.marketAssignment.upsert({
    where: { agentId_marketId: { agentId: agent.id, marketId: m.id } },
    create: { agentId: agent.id, marketId: m.id },
    update: {},
  })));

  for (const p of PRODUCTS) {
    const category = categoryByName.get(p.category)!;
    const product = await prisma.product.upsert({
      where: { name_unitLabel: { name: p.name, unitLabel: p.unitLabel } },
      create: {
        name: p.name,
        unitLabel: p.unitLabel,
        isPerishable: p.isPerishable,
        isStockable: p.isStockable,
        stockQuantity: p.stockQuantity,
        categoryId: category.id,
      },
      update: { stockQuantity: p.stockQuantity },
    });

    // Rejouable sans dupliquer : on ne crée les relevés de démo qu'une seule fois par produit.
    const alreadySeeded = await prisma.priceReading.count({ where: { productId: product.id } });
    if (alreadySeeded > 0) continue;

    // Trois relevés de démonstration (un par marché) pour que le prix de référence se calcule tout de suite.
    const prices: number[] = [];
    for (const market of markets.slice(0, 3)) {
      const jitter = (Math.random() - 0.5) * 0.03 * p.samplePrice;
      const price = Math.round(p.samplePrice + jitter);
      prices.push(price);
      await prisma.priceReading.create({
        data: {
          productId: product.id,
          marketId: market.id,
          agentId: agent.id,
          price,
        },
      });
    }

    // Historique de démonstration sur 30 jours, pour que le graphique de la fiche
    // produit montre une vraie tendance plutôt qu'un point unique (marche aléatoire
    // discrète, plausible pour un prix de marché — pas de vrai historique disponible).
    const days = 30;
    let walking = p.samplePrice * (0.94 + Math.random() * 0.06);
    for (let d = days; d >= 1; d--) {
      walking *= 1 + (Math.random() - 0.48) * 0.025;
      const computedAt = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      await prisma.referencePrice.create({
        data: {
          productId: product.id,
          value: Math.round(walking),
          readingsCount: 3,
          marketsCount: 3,
          windowHours: 24,
          computedAt,
        },
      });
    }

    // Publie tout de suite le prix moyen du jour (RG-01) : le script de seed n'appelle
    // pas l'API, donc on reproduit ici le même calcul que ReferencePricesService.recomputeForProduct.
    await prisma.referencePrice.create({
      data: {
        productId: product.id,
        value: prices.reduce((a, b) => a + b, 0) / prices.length,
        readingsCount: prices.length,
        marketsCount: 3,
        windowHours: 24,
      },
    });
  }

  console.log('Jeu de données de démonstration créé : %d marchés, %d produits.', markets.length, PRODUCTS.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
