# 0012 — Marque, société et finitions

## Société

OBP Market est un service de **ONE BUILD PLUS GROUPE (OBP)** — IFU 3202683256845, Parcelle M, Maison Assiba, Bokpè, Agori, Abomey-Calavi, +229 01 97 37 71 18 (source : facture FACT-2026-001, partie « Client »). Ces valeurs sont les défauts de `apps/web/src/lib/site.ts` et se remplacent par variables d'environnement. Les coordonnées du prestataire de la facture n'apparaissent nulle part sur le site.

À confirmer par OBP : que le numéro est bien actif sur WhatsApp (bouton flottant et liens `wa.me`), et l'adresse e-mail à afficher (vide pour l'instant, donc masquée).

## Marque

Logo `components/logo.tsx` : trois barres de prix ascendantes + un « + » orange (clin d'œil à One Build Plus), bleu `#2b3fae`. Favicon, icône d'écran d'accueil et image de partage (1200×630) sont générés par `icon.tsx`, `apple-icon.tsx` et `opengraph-image.tsx`. Un logo officiel remplacerait `LogoMark` sans autre changement.

## Finitions

- Mentions légales ; conditions et confidentialité nomment l'éditeur ; mesure d'audience Vercel Analytics (sans cookie) déclarée.
- Bouton WhatsApp flottant (message pré-rempli selon la page), lien « Aller au contenu », focus clavier visible, respect de `prefers-reduced-motion`.
- Données structurées JSON-LD : Organization, Product (produits et annonces).
- Immobilier : référence stable `OBP-XXXXX`, prix au m², lien carte, partage.
- Fiche produit : prix relevé dans chaque marché (`GET /products/:id/reference-price/markets`, sans donnée d'agent).
- **Sécurité** : `GET /price-readings?productId=` est désormais réservé au personnel (il exposait les agents).
- Tableau de bord `/backoffice` (compteurs de tâches selon le rôle).
- ESLint à zéro ; tests unitaires `photos.spec.ts`.
