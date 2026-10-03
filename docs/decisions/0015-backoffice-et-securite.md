# 0015 — Back-office complet et durcissement de la sécurité

Date : 2026-10-03 · Statut : appliqué

## Contexte

Un audit du back-office a montré que plusieurs routes de l'API étaient publiques alors qu'elles
modifient des données (création d'un utilisateur ADMIN, de produits, de marchés, recalcul des prix,
relevés de prix, liste des utilisateurs), et que les numéros de téléphone du personnel pouvaient se
connecter par code SMS sans mot de passe.

## Décisions

1. **Toutes les routes d'écriture exigent une connexion et un rôle** (`JwtAuthGuard` + `RolesGuard`).
   Seules restent publiques les lectures du catalogue, des marchés et des prix.
2. **Le personnel se connecte par e-mail et mot de passe uniquement.** La connexion par code est
   réservée aux clients et aux agents de terrain. Essais limités : 5 échecs par 10 minutes pour un
   couple e-mail + adresse IP.
3. **L'état du compte est lu en base** (désactivé, rôle) avec un cache de 30 s : désactiver un compte
   ou changer un rôle prend effet en moins d'une minute, sans attendre l'expiration du jeton.
   Jeton du personnel : 12 h.
4. **Journal d'activité** (`AuditLog`) pour toute action sensible : paiements, stock, prix, comptes,
   modération, bannières, immobilier. Lecture réservée à l'administrateur, aucune modification possible
   depuis l'application.
5. **Relevés de prix** : rattachés à l'agent connecté (plus d'`agentId` envoyé par le client), limités
   aux marchés qui lui sont affectés, avec position GPS ; sans GPS, le relevé est mis de côté pour contrôle.
6. **Retrait en magasin** : code à 6 chiffres unique (tirage cryptographique), prévisualisation puis
   confirmation, usage unique, consigné au journal.
7. **Garde-fous d'équipe** : on ne peut ni se désactiver ni changer son propre rôle ; il reste toujours
   au moins un administrateur actif. Mots de passe provisoires affichés une seule fois.
8. **Erreurs de base de données** converties en messages clairs (`PrismaExceptionFilter`).

## Matrice rôles → écrans

| Écran | Prix | Liquidité | Modérateur | Magasin | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Tableau de bord | ✔ | ✔ | ✔ | ✔ | ✔ |
| Relevés, Marchés et agents, Catalogue, Photos | ✔ | | | | ✔ |
| Commandes, Paiements, Demandes de liquidité, Clients | | ✔ | | | ✔ |
| Retrait en magasin, Stock | | ✔ | | ✔ | ✔ |
| Vendeurs, Immobilier, Bannières, Messages | | | ✔ | | ✔ |
| Équipe et accès, Journal d'activité | | | | | ✔ |
| Suppression d'un produit, désactivation d'un client | | | | | ✔ |

## Conséquences

- Migration `20261005090000_staff_audit` (colonnes `User.disabled`, `User.lastLoginAt`, table `AuditLog`).
- `scripts/provision-staff.mjs` crée les comptes du personnel avec des mots de passe aléatoires.
- `scripts/smoke-security.mjs` vérifie que les routes anciennement publiques refusent l'accès.
- Reste à faire avant le lancement : `OTP_DEV_MODE=false`, branchement WhatsApp/SMS pour les codes,
  stockage des photos hors base de données (liste des produits lente sur une base distante).
