# 0010 — Design inspiré de Motta et site complet

## Contexte

Le client veut une boutique qui ait le niveau d'un thème e-commerce abouti (référence : Motta). Le front se limitait à un catalogue sur la page d'accueil et à quelques écrans fonctionnels.

## Décisions

- **Design system** : tokens CSS dans `globals.css` (encre bleu nuit, accent bleu, Plus Jakarta Sans), composants partagés (`ProductCard`, `PageHero`, `Money`…). Pas de données fabriquées : pas de faux avis, faux « X vendus », faux prix barrés ni faux comptes à rebours. Photos libres de droits uniquement.
- **Parcours d'achat** : page `/boutique` (filtres, tri, vue grille/liste, URL partageable), fiche produit en deux colonnes avec onglets, favoris (navigateur), panier latéral avec total estimé au prix du marché, récemment consultés.
- **Pages d'information** : comment ça marche, FAQ, contact, conditions, confidentialité — contenu décrivant uniquement ce que la plateforme fait réellement. Les conditions et la confidentialité sont un socle à faire valider juridiquement par le client avant mise en production.
- **Contact** : formulaire public → table `ContactMessage` → page `/backoffice/messages` (MODERATEUR/ADMIN). Anti-spam : champ piège + 5 messages / 10 min / IP (`trust proxy` activé pour Render).
- **Devises** : affichage en EUR/USD/NGN/GHS à titre indicatif, paiement toujours en FCFA (voir `exchange-rates`). L'euro suit la parité fixe 655,957 ; les autres taux viennent d'une source publique, cachés 12 h.
- **Canaux de contact** : variables `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_ADDRESS` ; un canal vide n'est pas affiché.
- **Technique** : `not-found`, `error` (prop `retry` dans cette version de Next), `loading`, `sitemap`, `robots`, `manifest`, métadonnées Open Graph.

## Immobilier (parcelles, maisons, chambres, guest houses)

- **OBP Market est le vendeur** : pas de flux vendeur ni de modération tierce. Le personnel (MODERATEUR / ADMIN) publie les biens depuis `/backoffice/immobilier`.
- **Pas de panier ni de paiement en ligne** : le visiteur demande une visite (« Être rappelé(e) ») → table `PropertyInquiry` → onglet « Demandes » du back-office. Hypothèse retenue, à confirmer avec le client ; un acompte via Nyole pourrait s'ajouter plus tard.
- **Superficie libre** : valeur + unité (m², are, hectare), affichée telle que saisie ; `areaM2` (calculé côté API) sert au filtre et au tri, et l'équivalent m² est affiché quand l'unité n'est pas le m².
- **Prix fixé par OBP** (pas de prix de référence) ; pour une location, une période est obligatoire (nuit, mois, an).
- Types : parcelle, terrain agricole, maison/villa, appartement, chambre, guest house, local commercial. Statuts : disponible, réservé, vendu/loué. Un bien masqué ou supprimé disparaît du site.

## Conséquences

- Le stockage navigateur (panier, favoris, devise, session, récents) est décrit dans la page Confidentialité ; tout nouveau stockage doit y être ajouté.
- Les favoris ne sont pas synchronisés entre appareils (pas de compte côté serveur pour l'instant).
