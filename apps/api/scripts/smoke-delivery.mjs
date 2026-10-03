// Test de bout en bout de la livraison à domicile contre une API locale (`npm run start:dev`).
// Variables : STAFF_EMAIL / STAFF_PASSWORD (administrateur). Crée un client de test (+22990007777), un dépôt, des zones
// et une commande, puis supprime tout et remet le stock du produit à sa valeur d'origine.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001';
const PHONE = '+22990007777';
const J = { 'Content-Type': 'application/json' };
const prisma = new PrismaClient();
const call = async (method, path, token, body) => {
  const r = await fetch(`${API}${path}`, { method, headers: token ? { ...J, Authorization: `Bearer ${token}` } : J, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  return [r.status, data];
};
let failures = 0;
const ok = (label, got, want) => {
  if (got !== want) failures++;
  console.log(`${got === want ? 'OK ' : 'KO '} ${label} → ${got}${got === want ? '' : ` (attendu ${want})`}`);
};

const admin = (await call('POST', '/auth/staff-login', null, { email: process.env.STAFF_EMAIL, password: process.env.STAFF_PASSWORD }))[1]?.accessToken;
if (!admin) throw new Error('Connexion du personnel impossible : renseignez STAFF_EMAIL et STAFF_PASSWORD.');
const otp = (await call('POST', '/auth/request-otp', null, { phone: PHONE }))[1];
const login = (await call('POST', '/auth/verify-otp', null, { phone: PHONE, code: otp.devCode }))[1];
const client = login.accessToken;
const userId = login.user.id;

const products = (await call('GET', '/products'))[1];
const prices = new Map((await call('GET', '/reference-prices'))[1].map((p) => [p.productId, p.value]));
const product = products.find((p) => p.stockQuantity >= 3 && prices.has(p.id));
if (!product) throw new Error('Aucun produit en stock avec un prix publié pour le test.');
const unit = prices.get(product.id);
const stockBefore = product.stockQuantity;
let depotId, zoneId, inactiveZoneId, orderId;

try {
  depotId = (await call('POST', '/depots', admin, { name: 'Dépôt livraison test', city: 'Cotonou', address: 'Rue test 1' }))[1].id;
  zoneId = (await call('POST', '/delivery-zones', admin, { name: 'Zone livraison test', fee: 2000, depotId }))[1].id;
  inactiveZoneId = (await call('POST', '/delivery-zones', admin, { name: 'Zone fermée test', fee: 500 }))[1].id;
  await call('PATCH', `/delivery-zones/${inactiveZoneId}`, admin, { active: false });
  const items = [{ productId: product.id, quantity: 2 }];
  const address = 'Quartier Akpakpa, rue des palmiers, près de la pharmacie';

  console.log('--- Validation');
  ok('livraison sans zone refusée', (await call('POST', '/orders', client, { items, deliveryMode: 'LIVRAISON', deliveryAddress: address }))[0], 400);
  ok('livraison sans adresse refusée', (await call('POST', '/orders', client, { items, deliveryMode: 'LIVRAISON', deliveryZoneId: zoneId }))[0], 400);
  ok('zone désactivée refusée', (await call('POST', '/orders', client, { items, deliveryMode: 'LIVRAISON', deliveryZoneId: inactiveZoneId, deliveryAddress: address }))[0], 400);
  ok('zone inconnue refusée', (await call('POST', '/orders', client, { items, deliveryMode: 'LIVRAISON', deliveryZoneId: 'inconnue', deliveryAddress: address }))[0], 400);
  const stockAfterRefusals = (await call('GET', `/products/${product.id}`))[1].stockQuantity;
  ok('les commandes refusées ne réservent aucun stock', stockAfterRefusals, stockBefore);

  console.log('--- Commande en livraison');
  let r = await call('POST', '/orders', client, { items, deliveryMode: 'LIVRAISON', deliveryZoneId: zoneId, deliveryAddress: address, deliveryNote: 'Appeler en arrivant' });
  ok('création de la commande', r[0], 201);
  orderId = r[1]?.id;
  ok('frais de livraison figés', r[1]?.deliveryFee, 2000);
  ok('total = articles + frais', Math.round(r[1]?.totalAmount), Math.round(unit * 2 + 2000));
  ok('zone mémorisée', r[1]?.deliveryZoneName, 'Zone livraison test');
  ok('numéro par défaut = celui du compte', r[1]?.deliveryPhone, PHONE);
  ok('dépôt de la zone', r[1]?.depotId, depotId);
  ok('pas de suivi avant paiement', r[1]?.deliveryStatus, null);
  ok('livraison non demandable avant paiement', (await call('POST', `/orders/${orderId}/delivery-status`, admin, { status: 'PREPAREE' }))[0], 400);

  console.log('--- Paiement et suivi');
  ok('paiement confirmé', (await call('POST', `/orders/${orderId}/confirm-payment`, admin))[0], 201);
  r = await call('GET', `/orders/${orderId}`, client);
  ok('suivi initialisé : à préparer', r[1]?.deliveryStatus, 'A_PREPARER');
  const code = r[1]?.items?.[0]?.withdrawalCode;
  ok('un code de livraison est généré', /^\d{6}$/.test(code ?? ''), true);
  ok('le même code sert à toute la commande', new Set(r[1].items.map((i) => i.withdrawalCode)).size, 1);
  ok('liste des livraisons réservée au personnel', (await call('GET', '/orders/deliveries', client))[0], 403);
  ok('la commande est à livrer', (await call('GET', '/orders/deliveries', admin))[1].some((o) => o.id === orderId), true);
  ok('retrait magasin refusé avec le code d\'une livraison', (await call('GET', `/orders/withdrawal/${code}`, admin))[0], 400);
  ok('remise impossible avant le départ', (await call('POST', `/orders/${orderId}/deliver`, admin, { code }))[0], 400);
  ok('statut invalide refusé', (await call('POST', `/orders/${orderId}/delivery-status`, admin, { status: 'LIVREE' }))[0], 400);
  ok('commande préparée', (await call('POST', `/orders/${orderId}/delivery-status`, admin, { status: 'PREPAREE' }))[0], 201);
  ok('retour en arrière refusé', (await call('POST', `/orders/${orderId}/delivery-status`, admin, { status: 'PREPAREE' }))[0], 400);
  ok('commande en route', (await call('POST', `/orders/${orderId}/delivery-status`, admin, { status: 'EN_ROUTE' }))[0], 201);
  ok('code erroné refusé', (await call('POST', `/orders/${orderId}/deliver`, admin, { code: code === '123456' ? '654321' : '123456' }))[0], 400);

  console.log('--- Remise');
  ok('client ne peut pas confirmer la remise', (await call('POST', `/orders/${orderId}/deliver`, client, { code }))[0], 403);
  ok('remise confirmée avec le code', (await call('POST', `/orders/${orderId}/deliver`, admin, { code }))[0], 201);
  r = await call('GET', `/orders/${orderId}`, client);
  ok('commande livrée', r[1]?.deliveryStatus, 'LIVREE');
  ok('commande marquée remise', r[1]?.status, 'RETIREE');
  ok('double remise refusée', (await call('POST', `/orders/${orderId}/deliver`, admin, { code }))[0], 400);
  ok('apparaît dans les livraisons terminées', (await call('GET', '/orders/deliveries?done=1', admin))[1].some((o) => o.id === orderId), true);
  const notes = (await call('GET', '/notifications', client))[1];
  ok('le client a reçu les notifications', ['Commande préparée', 'Votre commande est en route', 'Commande livrée'].every((t) => (notes?.items ?? notes ?? []).some((n) => n.title === t)), true);

  console.log('--- Retrait classique inchangé');
  r = await call('POST', '/orders', client, { items: [{ productId: product.id, quantity: 1 }], depotId });
  ok('commande en retrait', r[0], 201);
  ok('frais nuls en retrait', r[1]?.deliveryFee, 0);
  ok('total sans frais', Math.round(r[1]?.totalAmount), Math.round(unit));
  const pickupId = r[1]?.id;
  await call('POST', `/orders/${pickupId}/confirm-payment`, admin);
  const pickup = (await call('GET', `/orders/${pickupId}`, client))[1];
  ok('pas de suivi de livraison en retrait', pickup.deliveryStatus, null);
  ok('retrait au magasin fonctionne', (await call('POST', '/orders/withdraw', admin, { code: pickup.items[0].withdrawalCode }))[0], 201);
  await prisma.order.delete({ where: { id: pickupId } }).catch(() => {});
} finally {
  if (orderId) await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: stockBefore } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ target: { startsWith: `Commande ${orderId?.slice(0, 8)}` } }, { target: { contains: 'livraison test' } }, { target: { contains: 'Zone fermée test' } }] } }).catch(() => {});
  await prisma.otpCode.deleteMany({ where: { phone: PHONE } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch((e) => console.log('Compte de test conservé :', e.code));
  for (const id of [zoneId, inactiveZoneId]) if (id) await prisma.deliveryZone.delete({ where: { id } }).catch(() => {});
  if (depotId) await prisma.depot.delete({ where: { id: depotId } }).catch(() => {});
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nTous les contrôles passent.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
