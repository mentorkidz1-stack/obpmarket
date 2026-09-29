// Script ponctuel : ajoute un historique de prix de démonstration sur 30 jours aux
// produits existants qui n'en ont pas encore beaucoup (ne duplique pas si déjà fait).
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const count = await prisma.referencePrice.count({ where: { productId: product.id } });
    if (count > 10) {
      console.log('Ignoré (déjà un historique) :', product.name);
      continue;
    }

    const latest = await prisma.referencePrice.findFirst({ where: { productId: product.id }, orderBy: { computedAt: 'desc' } });
    const base = latest?.value ?? 20000;

    let walking = base * (0.94 + Math.random() * 0.06);
    for (let d = 30; d >= 1; d--) {
      walking *= 1 + (Math.random() - 0.48) * 0.025;
      await prisma.referencePrice.create({
        data: {
          productId: product.id,
          value: Math.round(walking),
          readingsCount: 3,
          marketsCount: 3,
          windowHours: 24,
          computedAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log('Historique ajouté :', product.name);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
