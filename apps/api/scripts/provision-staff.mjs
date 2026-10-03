/**
 * Crée (ou met à jour) les comptes du personnel avec des mots de passe aléatoires robustes, et peut neutraliser
 * les comptes de démonstration (mot de passe « demo1234 » connu de tous).
 *
 *   node scripts/provision-staff.mjs                 crée / réinitialise les comptes ci-dessous, affiche les mots de passe
 *   node scripts/provision-staff.mjs --rotate-demo   en plus, remplace le mot de passe des comptes @obpmarket.test de démonstration
 *
 * Les mots de passe ne sont affichés qu'ici, une seule fois : notez-les, puis faites-les changer depuis
 * le back-office (Équipe → Réinitialiser, ou « Mon compte » → Changer mon mot de passe).
 * Utilise DATABASE_URL de apps/api/.env : attention, c'est la base de production si elle est partagée.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const password = () => randomBytes(12).toString('base64url');

const ACCOUNTS = [
  { fullName: 'Direction OBP (administrateur)', email: 'admin@obpmarket.test', phone: '+22901000010', role: 'ADMIN' },
  { fullName: 'Gestionnaire des prix', email: 'prix@obpmarket.test', phone: '+22901000011', role: 'GESTIONNAIRE_PRIX' },
  { fullName: 'Gestionnaire liquidité et paiements', email: 'liquidite@obpmarket.test', phone: '+22901000012', role: 'GESTIONNAIRE_LIQUIDITE' },
  { fullName: 'Modération', email: 'moderation@obpmarket.test', phone: '+22901000013', role: 'MODERATEUR' },
  { fullName: 'Agent du magasin', email: 'magasin@obpmarket.test', phone: '+22901000014', role: 'AGENT_MAGASIN' },
];

const rows = [];
for (const a of ACCOUNTS) {
  const pwd = password();
  await prisma.user.upsert({
    where: { email: a.email },
    create: { ...a, passwordHash: await bcrypt.hash(pwd, 10) },
    update: { fullName: a.fullName, role: a.role, disabled: false, passwordHash: await bcrypt.hash(pwd, 10) },
  });
  rows.push({ rôle: a.role, email: a.email, 'mot de passe': pwd });
}

if (process.argv.includes('--rotate-demo')) {
  const demos = await prisma.user.findMany({
    where: { email: { endsWith: '@obpmarket.test' }, NOT: { email: { in: ACCOUNTS.map((a) => a.email) } }, passwordHash: { not: null } },
  });
  for (const d of demos) {
    await prisma.user.update({ where: { id: d.id }, data: { passwordHash: await bcrypt.hash(password(), 10) } });
    console.log(`Compte de démonstration neutralisé : ${d.email}`);
  }
}

console.table(rows);
await prisma.$disconnect();
