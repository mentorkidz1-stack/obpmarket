// Test de bout en bout : dépôts, zones de livraison et retraits des vendeurs, contre une API locale (`npm run start:dev`).
// Variables : STAFF_EMAIL / STAFF_PASSWORD (administrateur ou gestionnaire liquidité).
// Crée un client de test (+22990008888), un dépôt et une zone, puis supprime tout à la fin.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001';
const PHONE = '+22990008888';
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

const staff = (await call('POST', '/auth/staff-login', null, { email: process.env.STAFF_EMAIL, password: process.env.STAFF_PASSWORD }))[1]?.accessToken;
if (!staff) throw new Error('Connexion du personnel impossible : renseignez STAFF_EMAIL et STAFF_PASSWORD.');
const otp = (await call('POST', '/auth/request-otp', null, { phone: PHONE }))[1];
const login = (await call('POST', '/auth/verify-otp', null, { phone: PHONE, code: otp.devCode }))[1];
const client = login.accessToken;
const userId = login.user.id;
let depotId, zoneId;

try {
  console.log('--- Dépôts et zones');
  ok('lecture des dépôts sans connexion', (await call('GET', '/depots'))[0], 200);
  ok('création de dépôt sans connexion', (await call('POST', '/depots', null, { name: 'x', city: 'y', address: 'zzz' }))[0], 401);
  ok('création de dépôt par un client', (await call('POST', '/depots', client, { name: 'x', city: 'y', address: 'zzz' }))[0], 403);
  let r = await call('POST', '/depots', staff, { name: 'Dépôt de test', city: 'Cotonou', address: 'Rue 123', phone: '+22990000000' });
  ok('création du dépôt', r[0], 201);
  depotId = r[1]?.id;
  ok('dépôt visible publiquement', (await call('GET', '/depots'))[1].some((d) => d.id === depotId), true);
  r = await call('POST', '/delivery-zones', staff, { name: 'Zone de test', fee: 1500, depotId });
  ok('création de la zone', r[0], 201);
  zoneId = r[1]?.id;
  ok('frais négatifs refusés', (await call('POST', '/delivery-zones', staff, { name: 'Zone', fee: -5 }))[0], 400);
  ok('désactivation du dépôt', (await call('PATCH', `/depots/${depotId}`, staff, { active: false }))[1]?.active, false);
  ok('dépôt désactivé absent de la liste publique', (await call('GET', '/depots'))[1].some((d) => d.id === depotId), false);
  await call('PATCH', `/depots/${depotId}`, staff, { active: true });

  console.log('--- Retraits');
  await prisma.walletTransaction.create({ data: { ownerId: userId, amount: 5000, reason: 'Crédit de test' } });
  ok('retrait sans connexion', (await call('POST', '/wallet/withdraw', null, { amount: 2000, method: 'MTN_MOMO', phone: '+22990008888' }))[0], 401);
  ok('montant sous le minimum', (await call('POST', '/wallet/withdraw', client, { amount: 500, method: 'MTN_MOMO', phone: '+22990008888' }))[0], 400);
  ok('solde insuffisant', (await call('POST', '/wallet/withdraw', client, { amount: 9000, method: 'MTN_MOMO', phone: '+22990008888' }))[0], 400);
  ok('opérateur invalide', (await call('POST', '/wallet/withdraw', client, { amount: 2000, method: 'PAYPAL', phone: '+22990008888' }))[0], 400);
  r = await call('POST', '/wallet/withdraw', client, { amount: 2000, method: 'MTN_MOMO', phone: '+22990008888' });
  ok('demande de retrait', r[0], 201);
  const first = r[1]?.id;
  let wallet = (await call('GET', '/wallet/mine', client))[1];
  ok('montant retenu sur le solde', wallet.balance, 3000);
  ok('montant en attente affiché', wallet.pendingPayouts, 2000);
  ok('liste des retraits réservée au personnel', (await call('GET', '/payouts', client))[0], 403);
  ok('le retrait apparaît côté OBP', (await call('GET', '/payouts?status=EN_ATTENTE', staff))[1].some((p) => p.id === first), true);
  ok('refus sans motif rejeté', (await call('POST', `/payouts/${first}/reject`, staff, { reason: '' }))[0], 400);
  ok('refus du retrait', (await call('POST', `/payouts/${first}/reject`, staff, { reason: 'Numéro incorrect' }))[0], 201);
  wallet = (await call('GET', '/wallet/mine', client))[1];
  ok('montant recrédité après refus', wallet.balance, 5000);
  ok('double traitement refusé', (await call('POST', `/payouts/${first}/paid`, staff, { reference: 'ABC123' }))[0], 409);

  r = await call('POST', '/wallet/withdraw', client, { amount: 4000, method: 'MOOV_MONEY', phone: '+22990008888' });
  const second = r[1]?.id;
  ok('seconde demande', r[0], 201);
  ok('demandes cumulées au-delà du solde refusées', (await call('POST', '/wallet/withdraw', client, { amount: 2000, method: 'MTN_MOMO', phone: '+22990008888' }))[0], 400);
  ok('versement confirmé', (await call('POST', `/payouts/${second}/paid`, staff, { reference: 'MOMO-778899' }))[1]?.status, 'PAYE');
  wallet = (await call('GET', '/wallet/mine', client))[1];
  ok('solde final après versement', wallet.balance, 1000);
  ok('plus rien en attente', wallet.pendingPayouts, 0);
  const notes = (await call('GET', '/notifications', client))[1];
  ok('le client a été notifié', (notes?.items ?? notes ?? []).some((n) => /Retrait effectué/.test(n.title)), true);
} finally {
  await prisma.payoutRequest.deleteMany({ where: { ownerId: userId } });
  await prisma.walletTransaction.deleteMany({ where: { ownerId: userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.otpCode.deleteMany({ where: { phone: PHONE } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  if (zoneId) await prisma.deliveryZone.delete({ where: { id: zoneId } }).catch(() => {});
  if (depotId) await prisma.depot.delete({ where: { id: depotId } }).catch(() => {});
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nTous les contrôles passent.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
