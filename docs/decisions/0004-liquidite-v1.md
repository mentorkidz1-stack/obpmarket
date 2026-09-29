# 0004 — Liquidité V1 : back-office sans connexion, offre et rachat manuels

**Date :** 2026-09-24
**Statut :** actif

## Contexte

Le module « Vente en liquidité » (LIQ-01 à LIQ-07) fait intervenir deux rôles : le client (déjà authentifié par téléphone/OTP depuis la phase 1) et un gestionnaire liquidité côté OBP. Aucune connexion pour les rôles internes (gestionnaire prix, gestionnaire liquidité, modérateur, agent magasin) n'a encore été construite — le back-office entier (contrôle des relevés compris, phase 1) fonctionne sans authentification, avec un utilisateur de démonstration récupéré par son rôle.

## Décision

- Les actions **client** (`POST /liquidity-requests`, `/mine`, `/:id/accept`, `/:id/reject`) exigent un jeton JWT valide, comme le reste des routes client (commandes, stock, portefeuille).
- Les actions **back-office** (`GET /liquidity-requests/pending`, `POST /:id/offer`) restent ouvertes, avec l'identifiant du gestionnaire transmis dans le corps de la requête — même schéma que la validation des relevés en phase 1.

## Conséquences

Avant la mise en production : construire une connexion pour les rôles internes (probablement e-mail/mot de passe plutôt que l'OTP client) et protéger toutes les routes back-office par un contrôle de rôle, pas seulement par convention côté front-end.
