# 0007 — Paiement Mobile Money manuel, sans agrégateur ni API

**Date :** 2026-09-27
**Statut :** actif

## Contexte

Le paiement était jusqu'ici entièrement simulé (`POST /orders/:id/pay` marquait la commande payée instantanément, sans aucun mouvement d'argent réel — voir 0003-boutique-v1.md). Il fallait faire évoluer ça vers un vrai encaissement Mobile Money (MTN MoMo, Moov Money) au Bénin.

Deux options ont été examinées avec la direction :
1. **Push USSD automatique** ("Request to Pay") : le client reçoit une notification sur son téléphone, entre son code, et le système sait immédiatement que c'est payé. Techniquement, ça exige toujours une API — soit celle d'un agrégateur (FedaPay, CinetPay, KkiaPay), soit l'API directe de MTN MoMo / Moov Money (ce qui suppose un enregistrement marchand auprès de l'opérateur, souvent une démarche administrative, pas seulement du code).
2. **Vérification manuelle** : aucune API, aucun agrégateur. Le client envoie lui-même l'argent à un numéro marchand affiché, indique la référence reçue par SMS, et un gestionnaire OBP confirme après vérification sur son propre compte marchand.

La direction a explicitement écarté les agrégateurs de paiement locaux et souhaite, pour cette version, ne dépendre d'aucune API du tout — la démarche d'obtention d'un accès API direct MTN/Moov est jugée trop lourde pour démarrer.

## Décision

Option 2 retenue : **paiement Mobile Money manuel**.

- Les numéros marchands MTN MoMo et Moov Money (`MOMO_MTN_NUMBER`, `MOMO_MOOV_NUMBER`, `MOMO_MERCHANT_NAME` dans `.env`) sont affichés au client via `GET /payment-info`.
- Le client envoie l'argent lui-même depuis son téléphone (hors du site), puis déclare l'opérateur utilisé et la référence reçue par SMS (`POST /orders/:id/submit-payment-reference`). La commande passe en statut `EN_VERIFICATION`.
- Un gestionnaire (`GESTIONNAIRE_LIQUIDITE` ou `ADMIN`) vérifie manuellement sur son propre compte marchand, dans le nouvel écran back-office `/backoffice/paiements`, puis confirme (`POST /orders/:id/confirm-payment`) ou rejette (`POST /orders/:id/reject-payment`).
- **Le stock est réservé dès la création de la commande** (comme avant), mais **le vendeur (revente entre clients, vendeur partenaire) n'est crédité qu'à la confirmation du paiement**, pas à la création de la commande. Chaque ligne consommée est tracée dans un nouveau modèle `OrderFill` (source, vendeur, quantité, prix verrouillé), réglé (`settledAt`) à la confirmation ou libéré (`releasedAt`) au rejet — sinon un client qui ne paie jamais aurait quand même crédité un vendeur et bloqué du stock indéfiniment.
- Si le gestionnaire rejette (référence introuvable, montant erroné…), la commande passe en `ANNULEE` et tout le stock réservé (annonces de revente, annonces vendeurs, stock propre d'OBP) est remis en vente automatiquement.

## Conséquences

- Aucune intégration technique avec un opérateur ou un agrégateur : juste des numéros affichés et une vérification humaine. Délai de confirmation non instantané (dépend de la disponibilité du gestionnaire).
- Avant une vraie mise en service : politique claire sur le délai maximal de vérification, et probablement une relance automatique (SMS/notification) si une commande reste trop longtemps en `EN_VERIFICATION`.
- Évolution possible plus tard vers l'option 1 (API directe MTN MoMo / Moov Money) si OBP obtient un accès marchand auprès des opérateurs — l'architecture (`OrderFill`, statuts `EN_VERIFICATION`/`PAYEE`) resterait la même, seule la confirmation deviendrait automatique au lieu de manuelle.
