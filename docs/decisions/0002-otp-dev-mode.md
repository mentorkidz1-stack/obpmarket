# 0002 — Code de vérification en clair en développement (pas de SMS)

**Date :** 2026-09-24
**Statut :** actif

## Contexte

Le cahier des charges (CPT-01) prévoit une connexion par téléphone avec un code envoyé par SMS. Aucune passerelle SMS (MTN, Moov, Celtiis) n'est encore choisie ni configurée.

## Décision

En développement, `POST /auth/request-otp` renvoie directement le code dans la réponse JSON (`devCode`) au lieu de l'envoyer par SMS, uniquement quand `NODE_ENV !== 'production'`. Le code est à usage unique, valable 5 minutes, stocké en clair dans la table `OtpCode`.

## Conséquences

- **Avant la mise en production**, il faut : brancher une vraie passerelle SMS (le champ `devCode` doit disparaître de la réponse), ajouter une limitation de fréquence des demandes (anti-abus), et envisager de hacher le code en base plutôt que de le stocker en clair.
- Le front-end (`apps/web`) affiche ce `devCode` directement dans l'écran de connexion en développement, avec une mention explicite « mode développement ».
