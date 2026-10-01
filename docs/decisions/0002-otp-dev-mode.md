# 0002 — Code de vérification en clair en développement (pas de SMS)

**Date :** 2026-09-24
**Statut :** actif

## Contexte

Le cahier des charges (CPT-01) prévoit une connexion par téléphone avec un code envoyé par SMS. Aucune passerelle SMS (MTN, Moov, Celtiis) n'est encore choisie ni configurée.

## Décision

`POST /auth/request-otp` renvoie directement le code dans la réponse JSON (`devCode`) au lieu de l'envoyer par SMS, tant que la variable d'environnement `OTP_DEV_MODE` n'est pas explicitement mise à `false`. Le code est à usage unique, valable 5 minutes, stocké en clair dans la table `OtpCode`.

**Correction du 2026-10-01** : ce comportement était initialement conditionné à `NODE_ENV !== 'production'`. Une fois le site déployé sur Render avec `NODE_ENV=production` (0009), plus personne ne pouvait se connecter : le code redevenait invisible alors qu'aucune passerelle SMS n'existe toujours. `OTP_DEV_MODE` est désormais indépendant de `NODE_ENV` — `NODE_ENV=production` ne concerne que des aspects réellement liés à l'environnement d'exécution (verbosité des erreurs, etc.), pas une fonctionnalité produit qui dépend uniquement de l'intégration SMS.

## Conséquences

- **Avant un vrai lancement commercial**, il faut : brancher une vraie passerelle SMS, puis mettre `OTP_DEV_MODE=false` (le champ `devCode` disparaît de la réponse), ajouter une limitation de fréquence des demandes (anti-abus), et envisager de hacher le code en base plutôt que de le stocker en clair.
- Le front-end (`apps/web`) affiche ce `devCode` directement dans l'écran de connexion tant qu'il est présent dans la réponse, avec une mention explicite « mode développement » — ce message reste donc visible sur le site déployé tant que `OTP_DEV_MODE` n'est pas désactivé, ce qui est volontaire et attendu pour l'instant.
