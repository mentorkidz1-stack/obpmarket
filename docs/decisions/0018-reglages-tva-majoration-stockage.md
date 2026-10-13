# 0018 — Réglages commerciaux : majoration du prix, TVA, frais de stockage ; charte verte et rouge

Date : 2026-10-13 · Statut : appliqué

## Demandes du client

1. Les prix doivent pouvoir s'afficher **avec taxe (TTC) ou hors taxe (HT)**, au choix du visiteur ; le taux de TVA se règle
   (18 % par défaut) et un produit peut ne pas être taxé.
2. Un produit acheté se retire au magasin dans un délai d'**un mois**. Au-delà, des **frais de stockage** s'appliquent
   (2,5 % du prix d'achat réel) ; le pourcentage doit être réglable.
3. Le **prix affiché** n'est plus le prix moyen des marchés : c'est ce prix **majoré de 7,5 %** (réglable).
4. **Charte graphique** : vert foncé `#005826` et rouge `#E5161F`.

## Décisions

- **Réglages** : une ligne `ShopSettings`, modifiable par l'administrateur (« Réglages commerciaux » : TVA, majoration,
  frais de stockage), avec exemples chiffrés ; chaque changement est consigné au journal. Une ligne absente = valeurs
  par défaut ci-dessus, sans script d'initialisation.
- **Prix affiché** = `round(prix moyen des marchés × (1 + majoration))`, hors taxe. L'API renvoie `value` (prix affiché)
  et `marketValue` (moyenne brute). Les écrans qui comparent aux relevés (agents, vendeurs, liquidité) utilisent
  `marketValue`. L'historique et les alertes de prix suivent le prix affiché.
- **TVA** : les prix sont hors taxe, la TVA s'ajoute. Taux par produit (`Product.vatRate` : vide = taux par défaut,
  0 = exonéré). Le visiteur choisit l'affichage TTC ou HT (mémorisé sur son appareil) ; le **montant à payer est
  toujours le total TTC**. La commande fige le taux de chaque ligne (`OrderItem.vatRate`) et la TVA totale
  (`Order.vatAmount`, déjà incluse dans `totalAmount`). Les frais de livraison sont considérés toutes taxes comprises.
- **Crédit des vendeurs et revendeurs** : calculé sur le prix moyen des marchés (pas sur le prix majoré) ; la
  majoration reste à OBP, en plus des commissions existantes.
- **Frais de stockage** : durée gratuite (30 jours) puis `frais % × prix d'achat HT` — **chaque mois entamé** ou **une
  seule fois** selon le réglage (par défaut : chaque mois). Les lots sont suivis dans l'ordre d'entrée (le plus
  ancien est vendu en premier). Où ils s'appliquent :
  - **Revente** : retenus sur le crédit du vendeur, mentionnés dans le motif du portefeuille.
  - **Produit payé « à retirer »** : date limite et frais affichés au client ; le magasin voit le montant à encaisser
    avant la remise (information, non bloquant).
  - **« Mon stock »** : durée gratuite restante, ou frais dus à ce jour.
  - Non appliqués pour l'instant à la **vente en liquidité** (rachat par OBP) : à décider.
- **Charte** : `--brand` vert foncé, `--accent` et `--down` rouge, fonds légèrement verdis, logo et images de partage
  recolorés ; mode sombre assorti.

## Migration

`20261014090000_settings_vat_storage` : table `ShopSettings`, colonnes `Product.vatRate`, `Order.vatAmount`,
`OrderItem.vatRate` (additives, valeurs par défaut).

## Points à confirmer avec le client

- Les prix des marchés relevés par les agents sont-ils déjà TTC ? Si oui, il faudra considérer la moyenne comme TTC
  et en déduire le hors taxe (aujourd'hui : la TVA s'ajoute au prix majoré).
- Frais de stockage : chaque mois entamé après le premier mois, ou une seule fois ?
- Frais de stockage à la liquidité (rachat par OBP) : oui ou non ?
- Faut-il bloquer la remise tant que les frais ne sont pas encaissés ?
