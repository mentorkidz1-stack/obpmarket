# 0019 — Vendeurs partenaires sur invitation uniquement

Date : 2026-10-15 · Statut : appliqué

## Demande

Retirer l'option « Devenir vendeur » de la plateforme : on ne s'inscrit pas librement. OBP Market conclut un partenariat avec
la personne, puis lui envoie un lien privé en message direct ; ce lien lui permet de devenir vendeur.

## Décisions

- **Plus d'inscription libre.** `POST /vendor-profile` exige un jeton d'invitation valide ; sans lui, l'API refuse (400
  sans jeton, 403 avec un faux jeton). Le blocage est côté serveur, pas seulement dans l'interface.
- **Invitation** (`VendorInvite`) : jeton secret de 24 caractères, à **usage unique**, qui **expire** (14 jours par défaut,
  réglable de 1 à 90). Elle peut être **réservée à un numéro de téléphone** : un autre compte ne peut pas l'utiliser. Elle
  peut proposer un type de compte et une zone (pré-remplis). Un mémo interne (« pour qui ») n'est jamais montré à l'invité.
- **L'invitation vaut validation** : le partenariat est déjà conclu, le compte vendeur est **actif immédiatement** (plus
  d'attente de modération). Les annonces restent modérées une par une.
- **Création** : modérateurs et administrateurs, depuis le back-office (« Invitations vendeurs »). L'écran propose
  « Copier le lien » et « Envoyer par WhatsApp » (message prêt, adressé au numéro s'il est connu), liste les invitations
  avec leur état (en attente, utilisée, expirée, annulée) et permet de les annuler.
- **Traçabilité** : création, annulation et utilisation sont consignées au journal d'activité ; la personne qui a créé
  l'invitation est notifiée quand elle est utilisée.
- **Site** : « Devenir vendeur » retiré de l'en-tête, du menu mobile, du pied de page, de l'accueil, de « Comment ça
  marche » et de l'annuaire des boutiques. `/vendeur` explique que le programme est sur invitation et renvoie vers
  Contact ; les vendeurs déjà partenaires s'y connectent comme avant. La page de partage `/vendeur/invitation/<jeton>`
  guide l'invité : connexion, puis ouverture du compte.
- **Protection** : vérification d'un jeton limitée à 30 par minute et par adresse ; jeton de 144 bits, impossible à deviner.

## Comptes existants

Les vendeurs déjà actifs, en attente ou suspendus ne changent pas. Un compte « refusé » ne peut plus se redéposer
librement : il faut une nouvelle invitation.

## Migration

`20261015090000_vendor_invites` : table `VendorInvite` (additive).
