# 0014 — Notifications, alertes de prix et envoi du code de connexion

## Décisions

- **Un point d'entrée unique** : `NotificationsService.notify(userId, { title, body, href })`. Il crée toujours une notification dans le site (cloche, page `/notifications`) et ajoute un message **WhatsApp** seulement si le canal est configuré **et** que le client a activé l'option (consentement explicite, exigé par WhatsApp Business). Une erreur d'envoi n'interrompt jamais l'opération métier.
- **Événements notifiés** : alerte de prix atteinte, compte vendeur validé / refusé / suspendu / réactivé, annonce validée / à corriger / refusée / en vente, paiement confirmé ou non retrouvé (acheteur), vente créditée (vendeur).
- **Alertes de prix** (`/price-alerts`) : un seuil en FCFA par client et par produit ; vérifiées à chaque nouveau prix de référence (`ReferencePricesService.recomputeForProduct`), puis désactivées une fois déclenchées.
- **Code de connexion** : envoyé par WhatsApp (modèle d'authentification) dès que le canal est configuré. Limites ajoutées : 3 codes / 10 min par numéro, 10 par adresse IP, 5 codes erronés / 10 min par numéro. Le code est généré avec `crypto.randomInt`.

## WhatsApp ou SMS ?

| | WhatsApp Business (Cloud API) | SMS |
|---|---|---|
| Couverture au Bénin | Très forte chez les clients ciblés | Universelle, y compris téléphones simples |
| Coût par message | Faible, facturé par conversation | Variable selon l'opérateur / l'agrégateur |
| Prérequis | Compte Meta Business vérifié, numéro dédié (non utilisé dans l'appli WhatsApp), 2 modèles de message approuvés | Contrat avec un agrégateur SMS acceptant le Bénin et l'identifiant d'expéditeur |
| Contenu riche | Oui | Non |

**Recommandation** : WhatsApp pour les notifications (déjà codé, il suffit de renseigner les variables) ; garder la possibilité du SMS comme **repli pour le code de connexion** si un client n'a pas WhatsApp.

## Mise en service WhatsApp (actions à faire par OBP / le développeur)

1. Créer un compte **Meta Business**, le faire vérifier, ajouter l'application **WhatsApp Business Platform** et un **numéro dédié**.
2. Faire approuver deux modèles (langue `fr`) :
   - `obp_notification` — catégorie *Utilitaire* — corps : `OBP Market : {{1}}`
   - `obp_otp` — catégorie *Authentification* — avec bouton « Copier le code ».
3. Sur Render (API), renseigner : `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (et au besoin `WHATSAPP_TEMPLATE`, `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_LANG`).
4. **Avant la vraie mise en production : `OTP_DEV_MODE=false`.** Tant qu'il vaut `true`, le code s'affiche à l'écran, donc n'importe qui peut se connecter avec le numéro d'un autre.

Sans ces variables, rien ne change : les notifications restent dans le site.

## Autres ajouts de ce lot

- **Carte intégrée** (OpenStreetMap, sans clé) sur la fiche d'un bien si `latitude` / `longitude` sont renseignées (champ « Position GPS » du back-office).
- **Tests de navigation** Playwright (`npm run test:e2e` dans `apps/web`) : 20 parcours publics, bureau et mobile, sans aucune écriture en base.
- Correctif « chargement infini » : l'API renvoie un corps vide pour un compte sans profil vendeur ; les réponses sont désormais lues sans erreur, un 401 déconnecte, et les pages à compte affichent un message avec « Réessayer ».

## Commissions (précision)

Le code applique déjà une commission à la revente (`RESALE_COMMISSION_RATE`, 5 % par défaut) et sur les ventes de vendeurs partenaires (`VENDOR_COMMISSION_RATE`, 8 % par défaut), visible dans le libellé des mouvements du portefeuille. Ces taux sont à confirmer avec OBP ; aucune mention n'a été ajoutée aux pages de présentation.
