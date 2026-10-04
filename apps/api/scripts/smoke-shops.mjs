// Test de bout en bout des vitrines vendeurs contre une API locale (`npm run start:dev`).
// Variables : STAFF_EMAIL / STAFF_PASSWORD (administrateur). Crée un vendeur (+22990006666) et un acheteur (+22990005555)
// de test, puis supprime tout.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001';
const SELLER = '+22990006666';
const BUYER = '+22990005555';
const J = { 'Content-Type': 'application/json' };
const prisma = new PrismaClient();
// La base distante coupe parfois une connexion inactive (« Server has closed the connection ») : un 500 isolé est rejoué une fois.
const call = async (method, path, token, body, retried = false) => {
  const r = await fetch(`${API}${path}`, { method, headers: token ? { ...J, Authorization: `Bearer ${token}` } : J, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 500 && !retried) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return call(method, path, token, body, true);
  }
  const data = await r.json().catch(() => null);
  return [r.status, data];
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

const admin = (await call('POST', '/auth/staff-login', null, { email: process.env.STAFF_EMAIL, password: process.env.STAFF_PASSWORD }))[1]?.accessToken;
if (!admin) throw new Error('Connexion du personnel impossible : renseignez STAFF_EMAIL et STAFF_PASSWORD.');
const sellerLogin = await loginByOtp(SELLER);
const buyerLogin = await loginByOtp(BUYER);
const S = sellerLogin.accessToken;
const B = buyerLogin.accessToken;

const products = (await call('GET', '/products'))[1];
const prices = new Map((await call('GET', '/reference-prices'))[1].map((p) => [p.productId, p.value]));
const product = products.find((p) => p.isStockable && !p.isPerishable && prices.has(p.id));
if (!product) throw new Error('Aucun produit stockable avec un prix publié pour le test.');
const ref = prices.get(product.id);
const photos = ['data:image/jpeg;base64,/9j/AAAA', 'data:image/jpeg;base64,/9j/BBBB'];
let profileId, listingId, depotsBlocking = false;
const orderIds = [];

try {
  console.log('--- Vendeur et annonce');
  profileId = (await call('POST', '/vendor-profile', S, { type: 'PROFESSIONNEL', zone: 'Cotonou', paymentInfo: 'MTN MoMo 0190000000' }))[1].id;
  ok('vitrine refusée avant validation du compte', (await call('PUT', '/shops/mine', S, { shopName: 'Chez Test Vendeur' }))[0], 403);
  await call('POST', `/vendor-profile/${profileId}/approve`, admin);
  listingId = (await call('POST', '/vendor-listings', S, { productId: product.id, quantity: 10, unitPrice: ref, photos }))[1].id;
  await call('POST', `/vendor-listings/${listingId}/approve`, admin);
  const depots = (await call('GET', '/depots'))[1];
  const received = await call('POST', `/vendor-listings/${listingId}/mark-received`, admin, depots.length ? { receivedQuantity: 10, depotId: depots[0].id } : { receivedQuantity: 10 });
  ok('annonce en vente', received[1]?.status, 'EN_VENTE');

  console.log('--- Vitrine');
  ok('publication sans nom refusée', (await call('PUT', '/shops/mine', S, { shopPublished: true }))[0], 400);
  ok('numéro WhatsApp invalide refusé', (await call('PUT', '/shops/mine', S, { shopName: 'Chez Test Vendeur', shopWhatsapp: 'abc' }))[0], 400);
  let r = await call('PUT', '/shops/mine', S, { shopName: 'Chez Test Vendeur', shopDescription: 'Produits frais du matin.', shopWhatsapp: '22997000000' });
  ok('création de la vitrine (brouillon)', r[0], 200);
  const slug = r[1]?.slug;
  ok('lien généré sans accents ni espaces', slug, 'chez-test-vendeur');
  ok('vitrine brouillon invisible', (await call('GET', `/shops/${slug}`))[0], 404);
  ok('vitrine brouillon absente de l\'annuaire', (await call('GET', '/shops'))[1].some((s) => s.slug === slug), false);
  ok('publication', (await call('PUT', '/shops/mine', S, { shopPublished: true }))[1]?.shopPublished, true);
  ok('le lien reste stable quand le nom change', (await call('PUT', '/shops/mine', S, { shopName: 'Chez Test Vendeur Bis' }))[1]?.slug, slug);

  r = await call('GET', `/shops/${slug}`);
  ok('page publique', r[0], 200);
  ok('nom et zone affichés', `${r[1]?.name}|${r[1]?.zone}`, 'Chez Test Vendeur Bis|Cotonou');
  ok('une annonce en vente', r[1]?.listings?.length, 1);
  ok('prix affiché = prix de référence du jour', r[1]?.listings?.[0]?.price, ref);
  ok('quantité disponible', r[1]?.listings?.[0]?.available, 10);
  const photoUrl = r[1]?.listings?.[0]?.photo;
  ok('photo servie par l\'API', typeof photoUrl === 'string' && photoUrl.includes(`/vendor-listings/${listingId}/photo/0`), true);
  const photoRes = await fetch(photoUrl);
  ok('la photo est une image', photoRes.headers.get('content-type'), 'image/jpeg');
  ok('annuaire public', (await call('GET', '/shops'))[1].some((s) => s.slug === slug), true);
  ok('boutique inconnue', (await call('GET', '/shops/nexiste-pas'))[0], 404);

  console.log('--- Statistiques');
  ok('visite comptée', (await call('POST', `/shops/${slug}/events`, null, { kind: 'VUE' }))[0], 201);
  await call('POST', `/shops/${slug}/events`, null, { kind: 'VUE' });
  await call('POST', `/shops/${slug}/events`, null, { kind: 'PARTAGE' });
  await call('POST', `/shops/${slug}/events`, null, { kind: 'CONTACT' });
  ok('événement inconnu refusé', (await call('POST', `/shops/${slug}/events`, null, { kind: 'PIRATE' }))[0], 400);
  ok('événement sur boutique inconnue', (await call('POST', '/shops/nexiste-pas/events', null, { kind: 'VUE' }))[0], 404);
  const mine = (await call('GET', '/shops/mine', S))[1];
  ok('visites sur 30 jours', mine?.stats?.last30Days?.views, 2);
  ok('partages sur 30 jours', mine?.stats?.last30Days?.shares, 1);
  ok('contacts sur 30 jours', mine?.stats?.last30Days?.contacts, 1);
  ok('courbe sur 14 jours', mine?.stats?.series?.length, 14);
  ok('ma vitrine exige une connexion', (await call('GET', '/shops/mine'))[0], 401);

  console.log('--- Achat via la vitrine');
  const before = (await prisma.vendorListing.findUnique({ where: { id: listingId } })).receivedQuantity;
  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 3, vendorListingId: listingId }] });
  ok('commande passée', r[0], 201);
  orderIds.push(r[1]?.id);
  const after = (await prisma.vendorListing.findUnique({ where: { id: listingId } })).receivedQuantity;
  ok('le stock du vendeur est servi en premier', before - after, 3);
  ok('prix facturé = prix de référence', Math.round(r[1]?.items?.[0]?.unitPrice), Math.round(ref));
  await call('POST', `/orders/${r[1].id}/confirm-payment`, admin);
  const wallet = (await call('GET', '/wallet/mine', S))[1];
  ok('le vendeur est crédité après paiement', wallet?.balance > 0, true);
  ok('ventes visibles dans les statistiques', (await call('GET', '/shops/mine', S))[1]?.stats?.sales30Days?.units, 3);

  r = await call('POST', '/orders', B, { items: [{ productId: product.id, quantity: 1, vendorListingId: 'inconnue' }] });
  ok('annonce inconnue : repli sur le stock normal', r[0], 201);
  orderIds.push(r[1]?.id);

  console.log('--- Suspension');
  ok('suspension du vendeur', (await call('POST', `/vendor-profile/${profileId}/suspend`, admin, { reason: 'Test de suspension' }))[0], 201);
  ok('vitrine masquée pour un vendeur suspendu', (await call('GET', `/shops/${slug}`))[0], 404);
  ok('annuaire sans la boutique suspendue', (await call('GET', '/shops'))[1].some((s) => s.slug === slug), false);
  ok('photo masquée pour un vendeur suspendu', (await fetch(photoUrl)).status, 404);
} finally {
  for (const id of orderIds) if (id) await prisma.order.delete({ where: { id } }).catch(() => {});
  const users = await prisma.user.findMany({ where: { phone: { in: [SELLER, BUYER] } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (profileId) {
    await prisma.vendorListing.deleteMany({ where: { vendorId: profileId } });
    await prisma.vendorProfile.delete({ where: { id: profileId } }).catch(() => {});
  }
  await prisma.walletTransaction.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.stockMovement.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.otpCode.deleteMany({ where: { phone: { in: [SELLER, BUYER] } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch((e) => console.log('Comptes de test conservés :', e.code));
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nTous les contrôles passent.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
