# 0011 — Performance : photos, cache et réveil de l'API

## Constat (mesuré en production, 2026-10-03)

- `GET /products` : 1,7 Mo, parce que chaque produit embarquait ses photos en base64 (data URI).
- Page d'accueil : 5,4 Mo (les mêmes photos recopiées dans le HTML et dans la charge utile React).
- Chaque page rappelait l'API (`cache: "no-store"`), dont le premier appel peut prendre 30 à 60 s quand Render gratuit s'est endormi.
- La fiche produit se chargeait après coup, depuis le navigateur.

## Décisions

- **Photos servies comme des fichiers** : `GET /products/:id/photo/:i`, `/properties/:id/photo/:i`, `/banners/:id/image` décodent la data URI et répondent avec `Cache-Control: public, max-age=31536000, immutable`. L'adresse porte un paramètre `?v=<hash>` qui change quand la photo change.
- **`PhotoUrlInterceptor` (global)** remplace partout les data URI par ces adresses (produits, y compris imbriqués dans commandes/stock/offres, biens, bannières). Les routes `…/admin/…` et `/banners/all` restent brutes : le back-office rééduque les photos à partir de données réelles. `PATCH /products/:id/photos` accepte aussi les adresses déjà servies (`resolvePhotoRefs`).
- **Front** : composant `Photo` (next/image) → redimensionnement + AVIF/WebP + cache CDN (hero 520 Ko → 84 Ko). Les data URI et `localhost` ne passent pas par l'optimiseur.
- **Cache des données** : `fetch(..., { next: { revalidate: 30 } })` côté serveur ; accueil en ISR (`revalidate = 30`) ; fiche produit rendue côté serveur (plus d'écran de chargement), avec métadonnées.
- **API** : compression gzip (`compression`), route `GET /health` sans base de données.
- **Réveil** : `.github/workflows/keepalive.yml` appelle `/health` toutes les 10 min. `vercel.json` place les fonctions Vercel en `pdx1` (même région que Render Oregon).

## Résultats (build de production local)

Accueil 5,4 Mo → 137 Ko (≈ 30 Ko compressé), liste produits 1,7 Mo → 2 Ko, fiche produit 52 Ko.

## Limites connues

- Les photos restent stockées en base : à terme, un stockage d'objets (Cloudinary, S3, Supabase Storage) est préférable, la base gratuite étant limitée en taille.
- Render gratuit : l'API s'endort sans ping, et la base PostgreSQL gratuite est supprimée après 30 jours — prévoir l'offre payante avant la mise en production réelle.
- Le ping GitHub Actions s'arrête si le dépôt reste inactif 60 jours ; il est alors à réactiver dans l'onglet Actions.
