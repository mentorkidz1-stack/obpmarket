# 0017 — Livraison à domicile et vitrines des vendeurs

Date : 2026-10-07 · Statut : appliqué (suite de 0016)

## Livraison à domicile (phase 2)

- Au panier, le client choisit **retrait** (dépôt au choix) ou **livraison à domicile** (zone, adresse, téléphone,
  consigne). La livraison ne concerne que les produits « retrait » ; les produits laissés en dépôt restent chez OBP.
- Les **frais de la zone sont figés** sur la commande (`deliveryFee`, `deliveryZoneName`) et inclus dans `totalAmount`,
  donc dans le montant envoyé à Nyole ou demandé en Mobile Money. Ils reviennent à OBP : les vendeurs sont crédités
  sur le prix des produits uniquement.
- Au paiement confirmé, **un seul code à 6 chiffres** couvre la commande : c'est la preuve de livraison. Le suivi
  démarre à « à préparer ».
- Le personnel (liquidité, magasin, administrateur) fait avancer la commande : **préparée → en route → livrée**, sans
  retour en arrière. La remise se confirme avec le code du client ; seul un administrateur peut confirmer sans code
  (consigné au journal). Chaque étape notifie le client.
- Un code de livraison n'est pas accepté au « Retrait en magasin », et inversement.
- Les transactions Prisma peuvent durer 30 s (5 s par défaut) : avec une base distante, elles échouaient en 500.

## Vitrines vendeurs (phase 3)

- Chaque vendeur actif peut créer **sa boutique** : nom, présentation, numéro WhatsApp affiché (facultatif),
  publication. Le lien `/boutique-de/<nom>` est généré une fois et ne change plus (il est partagé).
- La page publique montre les annonces **en vente** (reçues au dépôt), avec le **prix de référence du jour**, qui est
  le prix réellement payé. Un vendeur suspendu, ou une boutique non publiée, disparaît (page, annuaire, photos).
- **Acheter via la vitrine** : l'annonce du vendeur est servie en priorité (au même prix de référence), puis le
  circuit habituel (revente, autres vendeurs, stock OBP) complète si besoin. Le paiement, le dépôt, la livraison et
  le crédit du portefeuille ne changent pas : le vendeur n'encaisse jamais directement.
- **Partage** : bouton WhatsApp (message + lien), copie du lien, partage natif ; image d'aperçu générée par boutique
  (nom, nombre de produits, zone) ; données structurées et plan du site.
- **Statistiques** dans l'espace vendeur : visites, partages, contacts WhatsApp (30 jours), courbe sur 14 jours,
  ventes. Simples compteurs quotidiens, sans donnée personnelle, limités à 20 événements par minute et par visiteur.
- Annuaire public `/boutiques`.

## Limites connues

- Pas de logo ni de photo de couverture : l'initiale du nom sert d'avatar (les images sont stockées en base ; à
  reprendre avec un stockage d'images dédié).
- Pas d'avis clients, ni d'annonces « mises en avant » : à décider avec la direction.
- La modération agit sur le compte (suspension). Un masquage de boutique seule peut être ajouté si besoin.
- La base distante coupe parfois une connexion inactive (« Server has closed the connection ») : une requête isolée
  peut échouer en 500. Moins fréquent avec une base payante située à côté de l'API.
