# 0001 — SQLite en développement, PostgreSQL en production

**Date :** 2026-09-23
**Statut :** actif

## Contexte

Le cahier des charges (§8) prévoit PostgreSQL. Lors de la mise en place de l'environnement de développement, l'installation de PostgreSQL (téléchargeur d'environ 250-300 Mo) a échoué à plusieurs reprises à cause de coupures réseau côté développeur (connexion mobile limitée).

## Décision

Développer en local avec SQLite (fichier `apps/api/prisma/dev.db`, aucune installation requise) et repasser sur PostgreSQL avant la mise en production, ou dès qu'une connexion plus stable est disponible.

## Conséquences

- `prisma/schema.prisma` : `datasource db { provider = "sqlite" }`. Pour repasser en PostgreSQL : changer `provider` en `"postgresql"`, remettre `Decimal @db.Decimal(12, 2)` sur `PriceReading.price` et `ReferencePrice.value` (actuellement `Float`, SQLite ne supporte pas le type Decimal natif de Prisma), régénérer une migration (`npx prisma migrate dev`).
- Le code métier (`ReferencePricesService`, `PriceReadingsService`) évite volontairement le SQL brut spécifique à un moteur, pour rester portable entre les deux.
- Le calcul de prix en `Float` est suffisant pour le développement, mais l'arrondi financier exact (Decimal) est nécessaire avant la production.
