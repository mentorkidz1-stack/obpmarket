# 0013 — Parcours vendeur : finalisation

## Constat

Le parcours existait (demande de compte, annonce, modération, réception, vente) mais comportait des impasses :
une annonce « À corriger » ne pouvait pas être modifiée, une demande refusée ne pouvait pas être redéposée, la suspension n'existait pas,
les règles « 2 photos » et « produit stockable non périssable » n'étaient vérifiées que dans le navigateur, une réception partielle était impossible,
et `/vendeur` n'était pas consultable sans connexion.

## Décisions

- **API** : `PATCH /vendor-listings/:id` (le vendeur corrige une annonce en attente ou à corriger → elle repart en modération, motif effacé),
  `DELETE /vendor-listings/:id` (retrait tant que non mise en vente), `PATCH /vendor-profile/mine` (zone, paiement),
  `POST /vendor-profile` accepte une demande refusée (→ en attente), `GET /vendor-profile/all`, `POST /vendor-profile/:id/suspend|reactivate`,
  `POST /vendor-listings/:id/mark-received` accepte `receivedQuantity` (≤ annoncé).
- **Règles côté serveur** : au moins 2 photos, produit stockable non périssable, compte actif pour publier ou corriger.
- **Vente** : les annonces d'un vendeur **suspendu** ne sont plus tirées par les commandes (`orders.service.ts`).
- **Web** : `/vendeur` = présentation du programme pour les visiteurs (connexion puis retour grâce à `?next=`), formulaire de demande,
  états en attente / refusé (redépôt) / suspendu, et tableau de bord (compteurs, profil modifiable, annonces avec corriger / retirer, restant en stock).
  `VendorListingForm` sert à la création et à la correction. Back-office : onglets « À traiter » et « Vendeurs » (suspendre / réactiver),
  quantité reçue, vocabulaire sans jargon.

## Vérification

`apps/api/scripts/smoke-vendor.mjs` rejoue le parcours complet contre une API locale (25 contrôles). Il crée le vendeur de test `+22990009999`
dans la base utilisée par l'API : à supprimer ensuite si cette base est partagée avec la production.

## Reste hors périmètre

Stockage des photos d'annonces hors de la base. Les notifications au vendeur sont traitées dans `0014-notifications.md`.
Les commissions (5 % revente, 8 % vendeurs partenaires, par défaut) existent déjà dans le code ; rien n'est affiché à ce sujet sur les pages de présentation, à la demande d'OBP.
