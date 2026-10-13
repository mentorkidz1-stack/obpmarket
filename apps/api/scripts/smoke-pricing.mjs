// Test de bout en bout des réglages : majoration du prix, TVA et frais de stockage, contre une API locale.
// Variables : STAFF_EMAIL / STAFF_PASSWORD (administrateur). Crée deux comptes de test, puis supprime tout et remet
// les réglages et le stock dans leur état initial.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001';
const SELLER = '+22990003333';
const BUYER = '+22990003334';
const J = { 'Content-Type': 'application/json' };
const prisma = new PrismaClient();
const call = async (method, path, token, body, retried = false) => {
  const r = await fetch(`${API}${path}`, { method, headers: token ? { ...J, Authorization: `Bearer ${token}` } : J, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 500 && !retried) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return call(method, path, token, body, true);
  }
  return [r.status, await r.json().catch(() => null)];
};
let failures = 0;
const ok = (label, got, want) => {
  if (got !== want) failures++;
  console.log(`${got === want ? 'OK ' : 'KO '} ${label} → ${got}${got === want ? '' : ` (attendu ${want})`}`);
};
const loginByOtp = async (phone) => {
  const otp = (await call('POST', '/auth/request-otp', null, { phone }))[1];
  return (await call('POST', '/auth/verify-otp', null, { phone, code: otp.devCode }))[1];
};
const DAY = 24 * 60 * 60 * 1000;

const admin = (await call('POST', '/auth/staff-login', null, { email: process.env.STAFF_EMAIL, password: process.env.STAFF_PASSWORD }))[1]?.accessToken;
if (!admin) throw new Error('Connexion du personnel impossible : renseignez STAFF_EMAIL et STAFF_PASSWORD.');
const sellerLogin = await loginByOtp(SELLER);
const buyerLogin = await loginByOtp(BUYER);
const B = buyerLogin.accessToken;
const sellerId = sellerLogin.user.id;
const buyerId = buyerLogin.user.id;

const initial = (await call('GET', '/settings', admin))[1];
const products = (await call('GET', '/products'))[1];
const raw = new Map((await call('GET', '/reference-prices'))[1].map((p) => [p.productId, p]));
// Produit stockable, avec prix, sans annonce de revente en cours (pour que la revente de test soit servie en premier).
const busy = new Set((await prisma.resaleListing.findMany({ where: { status: 'EN_VENTE' }, select: { productId: true } })).map((l) => l.productId));
const product = products.find((p) => p.isStockable && !p.isPerishable && p.stockQuantity >= 3 && raw.has(p.id) && !busy.has(p.id));
if (!product) throw new Error('Aucun produit adapté pour le test.');
const stockBefore = product.stockQuantity;
const productVatBefore = product.vatRate ?? null;
const orderIds = [];
let listingId;

try {
  console.log('--- Réglages');
  ok('réglages publics lisibles sans connexion', (await call('GET', '/settings/public'))[0], 200);
  ok('réglages complets refusés sans connexion', (await call('GET', '/settings'))[0], 401);
  ok('réglages complets refusés à un client', (await call('GET', '/settings', B))[0], 403);
  ok('modification refusée à un client', (await call('PATCH', '/settings', B, { markupPct: 50 }))[0], 403);
  ok('TVA > 100 % refusée', (await call('PATCH', '/settings', admin, { vatRate: 150 }))[0], 400);
  ok('majoration négative refusée', (await call('PATCH', '/settings', admin, { markupPct: -3 }))[0], 400);
  let r = await call('PATCH', '/settings', admin, { markupPct: 7.5, vatEnabled: true, vatRate: 18, vatDefaultDisplay: 'TTC', storageFreeDays: 30, storageFeePct: 2.5, storageFeeMonthly: true });
  ok('réglages de la commande du client appliqués', r[0], 200);
  const pub = (await call('GET', '/settings/public'))[1];
  ok('TVA par défaut 18 %', pub.vat.rate, 18);
  ok('frais de stockage 2,5 %', pub.storage.feePct, 2.5);

  console.log('--- Prix affiché = prix moyen + 7,5 %');
  const list = (await call('GET', '/reference-prices'))[1];
  const row = list.find((p) => p.productId === product.id);
  ok('marketValue conservée', typeof row.marketValue, 'number');
  ok('value = moyenne des marchés × 1,075', row.value, Math.round(row.marketValue * 1.075));
  const single = (await call('GET', `/products/${product.id}/reference-price`))[1];
  ok('fiche produit : même prix affiché', single.value, row.value);
  await call('PATCH', '/settings', admin, { markupPct: 10 });
  const at10 = (await call('GET', '/reference-prices'))[1].find((p) => p.productId === product.id);
  ok('majoration réglable (10 %)', at10.value, Math.round(at10.marketValue * 1.1));
  await call('PATCH', '/settings', admin, { markupPct: 7.5 });

  console.log('--- TVA sur la commande');
  const unit = Math.round(row.marketValue * 1.075);
  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 2 }] });
  ok('commande créée', r[0], 201);
  orderIds.push(r[1]?.id);
  ok('prix unitaire figé = prix affiché HT', r[1]?.items?.[0]?.unitPrice, unit);
  ok('taux de TVA de la ligne = 18', r[1]?.items?.[0]?.vatRate, 18);
  const vat = Math.round(unit * 2 * 0.18);
  ok('TVA de la commande', r[1]?.vatAmount, vat);
  ok('total = HT + TVA', r[1]?.totalAmount, unit * 2 + vat);

  await call('PATCH', `/products/${product.id}`, admin, { vatRate: 0 });
  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 1 }] });
  orderIds.push(r[1]?.id);
  ok('produit exonéré : taux 0', r[1]?.items?.[0]?.vatRate, 0);
  ok('produit exonéré : pas de TVA', r[1]?.vatAmount, 0);
  ok('produit exonéré : total = HT', r[1]?.totalAmount, unit);
  await call('PATCH', `/products/${product.id}`, admin, { vatRate: 5 });
  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 1 }] });
  orderIds.push(r[1]?.id);
  ok('taux particulier du produit (5 %)', r[1]?.items?.[0]?.vatRate, 5);
  await call('PATCH', '/settings', admin, { vatEnabled: false });
  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 1 }] });
  orderIds.push(r[1]?.id);
  ok('TVA désactivée : aucune taxe', r[1]?.vatAmount, 0);
  ok('TVA désactivée : total = HT', r[1]?.totalAmount, unit);
  await call('PATCH', '/settings', admin, { vatEnabled: true });
  await call('PATCH', `/products/${product.id}`, admin, { vatRate: productVatBefore });

  console.log('--- Frais de stockage : produit retiré après un mois');
  const stored = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 1 }] });
  const storedId = stored[1]?.id;
  orderIds.push(storedId);
  await call('POST', `/orders/${storedId}/confirm-payment`, admin);
  let o = (await call('GET', `/orders/${storedId}`, B))[1];
  ok('dans la durée gratuite : pas en retard', o.items[0].storage?.overdue, false);
  ok('dans la durée gratuite : aucun frais', o.items[0].storage?.feeDue, 0);
  await prisma.order.update({ where: { id: storedId }, data: { paidAt: new Date(Date.now() - 45 * DAY) } });
  o = (await call('GET', `/orders/${storedId}`, B))[1];
  ok('après 45 jours : en retard', o.items[0].storage?.overdue, true);
  ok('après 45 jours : 2,5 % du prix d\'achat', o.items[0].storage?.feeDue, Math.round(o.items[0].unitPrice * 0.025));
  const code = o.items[0].withdrawalCode;
  const preview = (await call('GET', `/orders/withdrawal/${code}`, admin))[1];
  ok('le magasin voit les frais à encaisser', preview[0]?.storage?.feeDue, Math.round(o.items[0].unitPrice * 0.025));

  console.log('--- Frais de stockage : retenus à la revente');
  await prisma.stockHolding.create({ data: { ownerId: sellerId, productId: product.id, quantity: 5, avgUnitCost: 20000 } });
  await prisma.stockMovement.create({ data: { ownerId: sellerId, productId: product.id, kind: 'DEPOT', quantity: 5, unitValue: 20000, createdAt: new Date(Date.now() - 45 * DAY) } });
  const mine = (await call('GET', '/stock/mine', sellerLogin.accessToken))[1];
  const holding = mine.find((h) => h.productId === product.id);
  ok('Mon stock : frais dus à ce jour', holding?.storage?.feeDue, 5 * 20000 * 0.025);
  ok('Mon stock : conservation gratuite terminée', holding?.storage?.overdue, true);
  listingId = (await prisma.resaleListing.create({ data: { sellerId, productId: product.id, quantity: 2, status: 'EN_VENTE' } })).id;
  // Le stock du vendeur est réservé à la commande : on reproduit l'état normal d'une revente.
  await prisma.stockHolding.update({ where: { ownerId_productId: { ownerId: sellerId, productId: product.id } }, data: { quantity: 5 } });
  const sale = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 2 }] });
  ok('commande servie par la revente', sale[0], 201);
  orderIds.push(sale[1]?.id);
  await call('POST', `/orders/${sale[1].id}/confirm-payment`, admin);
  const wallet = (await call('GET', '/wallet/mine', sellerLogin.accessToken))[1];
  const credit = wallet.transactions.find((t) => t.amount > 0);
  const gross = row.marketValue * 2;
  // 2 unités du lot de 45 jours : 2 × 20 000 × 2,5 % = 1 000 F ; commission de revente 5 %.
  ok('crédit du vendeur = brut − commission − frais de stockage', Math.round(credit?.amount ?? -1), Math.round(gross - gross * 0.05 - 1000));
  ok('le motif mentionne les frais de stockage', /frais de stockage/.test(credit?.reason ?? ''), true);
} finally {
  await call('PATCH', '/settings', admin, {
    markupPct: initial.markupPct, vatEnabled: initial.vatEnabled, vatRate: initial.vatRate, vatDefaultDisplay: initial.vatDefaultDisplay,
    storageFreeDays: initial.storageFreeDays, storageFeePct: initial.storageFeePct, storageFeeMonthly: initial.storageFeeMonthly,
  });
  await call('PATCH', `/products/${product.id}`, admin, { vatRate: productVatBefore });
  for (const id of orderIds) if (id) await prisma.order.delete({ where: { id } }).catch(() => {});
  if (listingId) await prisma.resaleListing.delete({ where: { id: listingId } }).catch(() => {});
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: stockBefore } });
  const ids = [sellerId, buyerId];
  await prisma.stockMovement.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.stockHolding.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.walletTransaction.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.otpCode.deleteMany({ where: { phone: { in: [SELLER, BUYER] } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch((e) => console.log('Comptes de test conservés :', e.code));
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nTous les contrôles passent.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
