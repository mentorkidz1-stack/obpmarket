# OBP Market

Plateforme e-commerce à prix de marché en temps réel pour OBP Market (Bénin) : produits agricoles, vivriers et électroménagers, prix moyen calculé à partir de relevés terrain, boutique en ligne, dépôt/revente entre clients, rachat en liquidité, et annonces de vendeurs partenaires modérées par OBP Market.

Le cahier des charges complet (v0.2) sert de référence fonctionnelle pour ce dépôt.

## Structure du monorepo

```
obpmarket/
  apps/
    api/       NestJS — API, logique métier, prix de référence, registre de stock, portefeuille
    web/       Next.js — site client, back-office (rôles), PWA agent terrain
  packages/
    shared/    Types et constantes partagés entre api et web (à créer si besoin)
  docs/        Notes techniques et décisions
```

## Pile technique

- **Frontend** : Next.js (App Router), React, mobile-first
- **Backend** : NestJS (API REST), PostgreSQL, Redis (cache, files de tâches)
- **Paiement** : agrégateur Mobile Money / carte à intégrer (FedaPay, KkiaPay ou CinetPay — à choisir)

## Ordre de développement (voir §9 du cahier des charges)

1. **Phase 1 — Prix de marché** *(en cours)* : app agent terrain (PWA, hors ligne), moteur de calcul du prix moyen, contrôles anti-fraude, back-office de validation des relevés.
2. Phase 2 — Boutique client : catalogue, comptes, panier, paiement, retrait au magasin.
3. Phase 3 — Dépôt et liquidité : registre de stock, Mon stock, portefeuille, revente, rachat.
4. Phase 4 — Espace vendeur : compte vendeur, annonces à plusieurs photos, modération.
5. Phase 5 — Recette, pilote, lancement.

## Démarrage local

Prérequis : Node.js LTS, PostgreSQL (local ou via conteneur), Git.

```bash
cd apps/api && npm install && npm run start:dev
cd apps/web && npm install && npm run dev
```

(Instructions détaillées à compléter au fur et à mesure du scaffold.)
