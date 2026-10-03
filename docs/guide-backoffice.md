# Guide du back-office OBP Market

Connexion du personnel : `/connexion-interne` (e-mail + mot de passe).
Agents de terrain : `/agent` (numéro de téléphone + code reçu).
Chaque personne change son mot de passe provisoire dans **Mon compte**.

## Que fait chaque écran ?

- **Tableau de bord** : tâches en attente selon votre rôle, chiffre d'affaires, panier moyen, ventes sur
  14 jours, stock faible, prix à actualiser, produits les plus vendus.
- **Relevés à valider** : relevés écartés par le contrôle automatique (écart de prix, hors zone, sans GPS).
- **Marchés et agents** : créer un marché (coordonnées + rayon), affecter ou retirer des agents.
- **Catalogue** : produits (nom, catégorie, unité, périssable, géré en stock) et catégories.
- **Photos des produits** : images affichées dans la boutique.
- **Commandes** : recherche, filtre par statut, détail, export CSV pour Excel.
- **Paiements à vérifier** : confirmer ou rejeter un paiement Mobile Money déclaré.
- **Retrait en magasin** : saisir le code du client, vérifier les articles, confirmer la remise.
- **Stock** : fixer le nouveau total d'un produit avec un motif (réception, casse, inventaire).
- **Demandes de liquidité**, **Clients** (export CSV, désactivation par l'administrateur).
- **Vendeurs et annonces**, **Immobilier**, **Bannières**, **Messages**.
- **Équipe et accès** (administrateur) : créer un compte, changer un rôle, désactiver, réinitialiser un
  mot de passe.
- **Journal d'activité** (administrateur) : qui a fait quoi et quand, filtrable, export CSV.

## Parcours à tester

1. Administrateur : tableau de bord → Équipe (créer un compte de test) → se connecter avec ce compte.
2. Prix : Marchés (affecter l'agent) → `/agent` en tant qu'agent : relever un prix → Relevés.
3. Ventes : passer une commande côté boutique → Paiements (confirmer) → Retrait (saisir le code).
4. Stock : ajuster un produit → vérifier l'entrée dans le Journal.
5. Sécurité : désactiver le compte de test et constater qu'il est refusé en moins d'une minute.
