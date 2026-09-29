# 0006 — Connexion des rôles internes (e-mail + mot de passe)

**Date :** 2026-09-25
**Statut :** actif

## Contexte

Depuis la phase 1, tout le back-office (contrôle des relevés, liquidité, modération des vendeurs) était accessible sans connexion : les pages allaient chercher « le premier utilisateur du rôle voulu » via une route publique, pour simuler un acteur. C'était documenté comme provisoire dans 0004 et 0005. Le cahier des charges ne précise pas le mécanisme de connexion des rôles internes (CPT-01 ne concerne que les clients, par OTP).

## Décision

Connexion par e-mail + mot de passe pour les rôles internes (`AGENT`, `AGENT_MAGASIN`, `GESTIONNAIRE_PRIX`, `GESTIONNAIRE_LIQUIDITE`, `MODERATEUR`, `ADMIN`), sur le même mécanisme de jeton que les clients (`POST /auth/staff-login`, jeton JWT identique). Les routes back-office sont maintenant protégées par un contrôle de rôle (`RolesGuard`) en plus du jeton.

Comptes de démonstration créés par le seed avec un mot de passe fixe (`demo1234`, à changer avant toute vraie mise en service) :
- `gestionnaire.prix@obpmarket.test`
- `gestionnaire.liquidite@obpmarket.test`
- `moderatrice@obpmarket.test`

## Conséquences

- Les écrans back-office exigent maintenant une connexion réelle ; les anciennes routes « premier utilisateur du rôle » restent pour du dépannage mais ne sont plus utilisées par le front.
- Avant la production : vrai processus de création de compte interne (pas de mot de passe en clair dans un script de seed), politique de mot de passe, et probablement une authentification à deux facteurs pour les rôles sensibles (BO-09 du cahier des charges le demande explicitement).
