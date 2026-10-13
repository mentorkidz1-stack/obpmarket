# 0020 — La méthode de calcul du prix n'est jamais montrée au public

Date : 2026-10-13 · Statut : appliqué (à déployer : API puis site)

## Contexte

Le client (ONE BUILD PLUS GROUPE) ne veut pas que le public sache comment le prix est établi (moyenne des relevés des
agents sur les marchés, plus une majoration). OBP Market doit se présenter comme une boutique en ligne normale : elle
vend ses propres produits et ceux de partenaires, à un prix facile et accessible.

## Décision

1. **L'API publique ne renvoie que le prix affiché.** `GET /reference-prices`, `…/latest`, `…/history` et
   `GET /products/:id/reference-price` renvoient `{ id, productId, value, computedAt, changePct7d? }`. `value` est le prix de
   vente (hors taxe). Plus de moyenne brute, de nombre de relevés, de nombre de marchés ni de fenêtre de calcul.
2. **Le détail du calcul est réservé au personnel et aux agents**, par des routes protégées :
   - `GET /reference-prices/market` (agents, gestionnaires prix et liquidité, modérateurs, administrateurs) : moyenne
     brute avec `readingsCount`, `marketsCount`, `windowHours` ;
   - `GET /products/:id/reference-price/markets` (gestionnaires prix et liquidité, administrateurs) ;
   - `GET /markets` et `GET /markets/:id` : la liste des marchés relevés n'est plus publique.
3. **Le site n'affiche plus** « prix du marché », « prix moyen », « relevés », « marchés suivis », « nos agents »,
   « juste prix » : accueil, boutique, fiche produit (plus de section « Prix relevé dans chaque marché »), Comment ça marche,
   FAQ, conditions, pied de page, page de connexion, aperçus de partage (Open Graph), manifeste, bannières.
4. **Ton éditorial** : boutique classique à prix accessibles ; produits d'OBP et de vendeurs partenaires ; retrait au
   magasin ou livraison ; paiement Mobile Money ou carte ; immobilier proposé par OBP.
5. **Côté vendeur**, le « prix de référence » du formulaire est le prix de vente affiché au public (jamais la moyenne). La
   tranche de modération des annonces est comparée à ce même prix.

Le back-office, l'application agent et la documentation interne gardent le vocabulaire métier (relevés, marchés, moyenne).

## Conséquences

- Les scripts `smoke-pricing.mjs` et `smoke-security.mjs` et le test e2e « aucune page publique ne dévoile la méthode »
  vérifient qu'aucune de ces données ne fuit.
- Un déploiement de l'API est indispensable : tant qu'il n'est pas fait, l'ancienne API continue d'exposer les champs.
- Les crédits vendeurs restent calculés sur la moyenne brute (la majoration reste à OBP) : rien ne change dans les montants.
