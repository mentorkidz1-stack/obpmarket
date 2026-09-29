# 0005 — Espace vendeurs V1 : catalogue existant, photos en base, réception simplifiée

**Date :** 2026-09-25
**Statut :** actif

## Contexte

Le module 4.12 (VEN-01 à VEN-15) prévoit des annonces sur un produit du catalogue **ou** un nouveau produit, une pièce d'identité à l'inscription, et deux étapes distinctes côté OBP (validation de l'annonce, puis réception physique au magasin). Aucun stockage de fichiers (S3 ou équivalent) n'est configuré.

## Décisions

1. **Produit du catalogue uniquement.** Une annonce vendeur référence un `Product` existant ; la création d'un nouveau produit par un vendeur n'est pas construite dans cette passe (elle demanderait son propre circuit de validation catalogue).
2. **Photos en base, pas de stockage cloud.** Comme `PriceReading.photoUrl` déjà en place, les photos d'annonce sont envoyées en *data URI* (image encodée en base64) et stockées directement dans `VendorListing.photos` (JSON). Fonctionne réellement de bout en bout en développement ; à remplacer par un vrai stockage objet avant la production (les data URI gonflent la base).
3. **Pas de pièce d'identité à l'inscription.** L'inscription vendeur ne collecte que le type de compte, la zone et le moyen de paiement — pas de document d'identité (évite de gérer un document sensible sans stockage sécurisé dédié).
4. **Validation et réception regroupées côté back-office.** Le gestionnaire approuve (`VALIDEE`) puis confirme la réception au magasin (`EN_VENTE`) dans le même écran, sans écran dédié pour l'agent magasin.
5. **Pas de correction en ligne.** Une annonce « à corriger » ou refusée n'a pas de flux de modification : le vendeur doit recréer une annonce. VEN-09 (modification qui repasse en validation) n'est pas construit.
6. **Stock fongible, comme la revente.** Une fois en vente, les unités d'un vendeur rejoignent le même pool que le stock OBP et les annonces de revente (file FIFO : revente clients → annonces vendeurs → stock OBP). L'acheteur ne voit pas « vendu par » (VEN-10) — cohérent avec le choix déjà fait pour la revente entre clients.

## Conséquences

Avant la mise en production : stockage objet réel pour les photos, vérification d'identité, écran dédié pour l'agent magasin, flux de correction d'annonce, et étiquetage de l'origine du stock si le badge « vendeur vérifié » (VEN-10) est finalement requis.
