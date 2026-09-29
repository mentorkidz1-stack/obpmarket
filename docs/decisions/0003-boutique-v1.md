# 0003 — Boutique V1 : retrait seul, paiement simulé

**Date :** 2026-09-24
**Statut :** actif

## Contexte

Le cahier des charges décrit deux choix à la commande — retrait au magasin (CMD-02, RET-01 à RET-04) ou dépôt en stock (DEP-01 à DEP-06) — et un paiement par Mobile Money via un agrégateur (CMD-04). Le module « Mon stock » (registre de dépôt, revente, portefeuille — phase 3) n'est pas encore construit, et aucun compte agrégateur de paiement (FedaPay, KkiaPay, CinetPay) n'est configuré.

## Décisions

1. **Retrait uniquement en V1.** Le dépôt (`FulfillmentMode.DEPOT`) existe dans le schéma pour ne pas avoir à migrer plus tard, mais n'est pas proposé côté client tant que le registre de stock n'existe pas — proposer un dépôt qui ne mène à rien serait trompeur.
2. **Stock simplifié.** `Product.stockQuantity` représente simplement les unités disponibles à la vente, décrémentées à la commande. Ce n'est pas encore le registre de stock complet (mouvements, propriétaire, rapprochement — RG-04) prévu pour le dépôt/la revente.
3. **Paiement simulé.** `POST /orders/:id/pay` marque la commande payée immédiatement, sans passer par une passerelle réelle. Aucune donnée de carte ou de Mobile Money n'est collectée.

## Conséquences

Avant la mise en production : brancher un agrégateur de paiement réel, construire le registre de stock pour activer le dépôt, et ajouter le scan du bon de retrait côté agent magasin (RET-02).
