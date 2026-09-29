# 0009 — Déploiement gratuit (Vercel + Render) et bascule PostgreSQL

**Date :** 2026-09-29
**Statut :** actif

## Contexte

Le site tournait jusqu'ici uniquement en local. Avant de valider le budget VPS avec le client (voir le budget d'hébergement 1 an), l'utilisateur veut un premier déploiement réel et accessible publiquement, en utilisant les offres gratuites des hébergeurs plutôt que le VPS payant — le VPS reste l'option retenue pour la mise en production définitive, une fois le budget validé.

Décision 0001 (SQLite en développement) prévoyait explicitement de repasser sur PostgreSQL « avant la mise en production, ou dès qu'une connexion plus stable est disponible » : ce moment est arrivé.

## Décision

- **PostgreSQL** : `prisma/schema.prisma` bascule sur `provider = "postgresql"`. L'historique de migrations SQLite est archivé dans `prisma/migrations_sqlite_archive/` (non rejouable tel quel sur Postgres) ; une nouvelle migration initiale sera générée dès qu'une base Postgres réelle est disponible.
  - **Les champs `price`/`value` restent en `Float`**, contrairement à ce que 0001 envisageait (`Decimal @db.Decimal(12,2)`) : le FCFA (XOF) n'a pas de subdivision (pas de centimes), tous les montants manipulés par l'app sont des entiers, et un `Float64` représente exactement tout entier jusqu'à 2^53 — aucun risque d'arrondi. `Decimal` aurait changé le type JS de `number` à `Decimal` (decimal.js) partout dans le code métier, un chantier plus lourd qu'utile ici.
- **Hébergement** :
  - **API + PostgreSQL** → [Render](https://render.com), offre gratuite (`render.yaml` à la racine du dépôt : blueprint qui provisionne les deux services d'un coup).
  - **Frontend (Next.js)** → [Vercel](https://vercel.com), offre gratuite.
- **Limites connues de l'offre gratuite** (à surveiller, sans bloquer le lancement) :
  - Le service web gratuit Render se met en veille après une période d'inactivité ; la première requête qui le réveille prend 30 à 60 secondes.
  - La base PostgreSQL gratuite Render a des limites (stockage, durée) précisées dans leur documentation au moment de la création — à vérifier avant de s'appuyer dessus longtemps.
  - Sortir du `localhost` rend le **webhook Nyole réellement fonctionnel** (0008) : jusqu'ici seul le filet de sécurité `reconcile-payment` fonctionnait en local, faute d'URL publique.

## Conséquences

- Le développement local est interrompu tant qu'aucune base PostgreSQL n'est branchée dans `apps/api/.env` : `DATABASE_URL="file:./dev.db"` n'est plus compatible avec `provider = "postgresql"`. En attendant une base locale, la base Render (accessible depuis l'extérieur) sert aussi pour le développement.
- Prochaine étape : l'utilisateur crée les comptes Render et Vercel (étape qui lui appartient), provisionne le blueprint, puis transmet l'URL PostgreSQL générée pour que la migration initiale et le seed soient exécutés dessus.
- Avant un vrai lancement commercial : passer aux offres payantes (Render ou le VPS budgété) pour éviter la mise en veille et les limites de la base gratuite.
