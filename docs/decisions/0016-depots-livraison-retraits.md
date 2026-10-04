# 0016 — Dépôts, zones de livraison et retraits des vendeurs

Date : 2026-10-06 · Statut : phase 1 appliquée (voir « Suite »)

## Modèle retenu

OBP garde la main sur l'argent et sur la marchandise ; le vendeur apporte sa clientèle.

1. Le vendeur (ou le revendeur) publie une annonce. La marchandise est **reçue dans un dépôt OBP**.
2. Le client **paie à OBP** (Nyole ou Mobile Money), jamais au vendeur.
3. OBP **remet la marchandise** : retrait au dépôt avec code, ou livraison à domicile assurée par OBP depuis un dépôt.
4. Le vendeur est **crédité sur son portefeuille** à la confirmation du paiement (comportement existant).
5. Le vendeur **demande un retrait** ; OBP verse les fonds par Mobile Money puis confirme.

## Décisions de la phase 1

- **Dépôts** (`Depot`) : créés, modifiés, désactivés à volonté par l'administration (ou le gestionnaire
  liquidité), sans liste figée dans le code. Un dépôt qui a reçu des annonces ne peut qu'être désactivé.
- **Réception d'une annonce** : le dépôt est obligatoire dès qu'au moins un dépôt est actif
  (`VendorListing.depotId`).
- **Zones de livraison** (`DeliveryZone`) : nom, frais en FCFA, dépôt de rattachement facultatif.
- **Retraits** (`PayoutRequest`) : la demande **retient le montant tout de suite** sur le portefeuille
  (transaction sérialisable, pas de double demande). OBP verse hors plateforme puis marque la demande
  payée avec la référence du versement ; un refus recrédite le montant. Minimum 1 000 F. Chaque étape
  notifie le vendeur et est consignée au journal d'activité.
- L'ancien retrait instantané (débit sans validation) est remplacé.

## Suite (phases suivantes, réalisées dans la décision 0017)

- **Phase 2** : choix retrait / livraison au paiement, frais de la zone ajoutés à la commande, adresse du
  client, suivi de livraison (préparée, en route, livrée) dans le back-office.
- **Phase 3** : vitrine publique par vendeur, liens de partage (WhatsApp) avec aperçu, statistiques
  de vues et de partages, avis.
- À trancher : moment exact où le gain devient retirable (dès le paiement, comme aujourd'hui, ou après
  la remise ou la livraison, pour couvrir les retours).
