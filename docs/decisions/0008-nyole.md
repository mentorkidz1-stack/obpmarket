# 0008 — Passerelle de paiement Nyole

**Date :** 2026-09-29
**Statut :** actif

## Contexte

0007 documentait le choix d'un paiement Mobile Money **entièrement manuel**, faute d'accès direct à l'API MTN MoMo/Moov (démarche marchand jugée trop lourde) et par refus des agrégateurs classiques (FedaPay, CinetPay/KkiaPay).

L'utilisateur a découvert [Nyole](https://nyole.com) (nom technique interne « Afriflow », visible dans les en-têtes de webhook) : un agrégateur pan-africain (22 pays) qui permet d'encaisser et de recevoir des webhooks signés **sans dossier d'entreprise pour démarrer** — seule une vérification d'identité personnelle est exigée, et uniquement au moment du retrait des fonds, pas à l'inscription ni pour encaisser. C'est ce qui débloque la situation : la case « dossier de société » qui avait fait écarter les autres agrégateurs ne s'applique pas ici.

Nyole est un agrégateur classique (commission 5 % par paiement réussi) : la décision 0007 de ne dépendre d'aucune API est donc explicitement abandonnée pour ce motif précis, avec l'accord de l'utilisateur.

## Décision

Intégration de l'API Nyole (`https://app.nyole.com/api/v1`) comme moyen de paiement principal, avec le flux manuel de 0007 conservé comme **secours** (si la page Nyole échoue, ou en attendant que le compte Nyole soit pleinement opérationnel).

- **Création de session** (`OrdersService.createNyoleSession`) : `POST /v1/checkout/sessions` avec `metadata.order_id` = notre id de commande (clé d'idempotence = l'id de commande, pour qu'un double clic renvoie la même session au lieu d'en créer une deuxième). Le client est redirigé vers la page hébergée par Nyole (`session.url`) — aucune donnée de carte ou de mobile money ne transite par notre serveur.
- **Confirmation automatique** (`OrdersController` → `POST /webhooks/nyole`, route publique) : Nyole envoie `payment.completed` signé HMAC-SHA256 (en-têtes `X-Afriflow-Timestamp`/`X-Afriflow-Signature`, tolérance anti-rejeu de 5 min). La signature est vérifiée sur le **corps brut** (`main.ts` : `NestFactory.create(AppModule, { rawBody: true })`) avant tout traitement.
- `OrdersService.confirmPayment`/`rejectPayment` acceptent désormais un `actorId` **nullable** : un gestionnaire (flux manuel, back-office) ou `null` (confirmation automatique par webhook). Le reste de la logique (règlement des `OrderFill`, crédit vendeur, bon de retrait/dépôt, libération du stock au rejet) est strictement identique aux deux flux, garantissant qu'un vendeur n'est jamais crédité avant confirmation réelle du paiement, quel que soit le canal.
- `payment.failed`/`payment.cancelled` déclenchent `rejectPayment(null, ...)` automatiquement : le stock réservé est remis en vente sans intervention humaine.
- **Filet de sécurité** (`OrdersService.reconcileNyoleSession`, `POST /orders/:id/reconcile-payment`) : en développement local, le webhook ne peut pas atteindre `localhost` (pas d'URL publique) — le webhook n'arrive donc jamais. La page de retour (`success_url`) interroge activement `GET /v1/checkout/sessions/{id}/status` pendant quelques secondes (recommandé par la doc Nyole elle-même : « pour rattraper un webhook manqué ») et confirme/rejette la commande sur cette base si le webhook n'est pas encore arrivé. Utile aussi en production comme rattrapage si une livraison de webhook échoue.
- `payment.updated` (ex. `REFUNDED`) n'est **pas** traité automatiquement : un remboursement survient après une vente déjà réglée (vendeurs déjà crédités, stock déjà remis au client) et sa réversion complète est hors périmètre pour l'instant — nécessite une reprise manuelle par un gestionnaire.
- Clé de test (`af_test_sec_...`) utilisée en développement (`livemode: false`, aucun paiement réel) ; la clé de production (`af_live_sec_...`) fournie par l'utilisateur est conservée en commentaire dans `.env`, à activer uniquement au passage en production.

## Conséquences

- Le wording client (page de paiement, panier, portefeuille) ne mentionne plus l'absence de passerelle — cohérent avec un vrai produit.
- Une commande peut rester en `EN_ATTENTE_PAIEMENT` indéfiniment si le client ouvre la session Nyole puis abandonne sans jamais revenir ni relancer : pas de nettoyage automatique pour l'instant (le stock reste réservé). À traiter plus tard (expiration + libération automatique après un délai).
- Le solde Nyole se reverse vers un compte Mobile Money **sous 24 à 48 h**, pas instantanément — sans incidence sur le client (qui est débité immédiatement), mais à connaître pour la trésorerie d'OBP Market.
- Avant la mise en production : compléter la vérification d'identité Nyole (nécessaire pour retirer les fonds), remplacer la clé de test par la clé live, et déclarer l'URL de webhook (`{API_PUBLIC_URL}/webhooks/nyole`) dans l'espace Nyole.
