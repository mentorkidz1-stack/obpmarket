# Crédits des photos

Les photos de `apps/web/public/produits`, `public/promos` et `public/immobilier` viennent d'**Unsplash** (licence Unsplash :
usage commercial autorisé, sans obligation de citer l'auteur). Elles servent d'illustration.

## Produits d'exemple (`npm run seed:catalog`)

44 produits d'exemple complètent le catalogue : céréales, tubercules, légumes, fruits, huiles, épicerie et électroménager.
Leurs **prix et leurs stocks sont fictifs** (trois relevés d'un agent de démonstration et un historique de 30 jours),
comme ceux du jeu de données initial. Pour les retirer avant de saisir les vrais produits : `npm run unseed:catalog`
(un produit déjà commandé est conservé).

Les photos sont dans `apps/web/public/produits/<nom>.jpg`, déclarées dans `apps/api/prisma/seed-catalog.ts`.
Pour remplacer la photo d'un produit, utilisez le back-office (Prix, puis Photos des produits).

Identifiants Unsplash (adresse `https://unsplash.com/photos/<identifiant>`) :

| Fichier | Identifiant |
|---|---|
| mil | 1633101143189-d28a58810351 |
| sorgho | 1758356860542-a2df92aad294 |
| soja | 1601993488142-d3050a16478d |
| arachide | 1549978113-29eb25c8177f |
| igname | 1757283961582-ab596b0ca595 |
| manioc | 1757283961570-682154747d9c |
| patate-douce | 1730815048561-45df6f7f331d |
| taro | 1757283961544-e161ac41b201 |
| oignon | 1618512496248-a07fe83aa8cb |
| piment | 1722782034797-d1dc4157026e |
| gombo | 1425543103986-22abb7d7e8d2 |
| aubergine | 1683543122945-513029986574 |
| carotte | 1590868309235-ea34bed7bd7f |
| chou | 1652860213441-6622f9fec77f |
| poivron | 1601648764658-cf37e8c89b70 |
| concombre | 1449300079323-02e209d9d3a6 |
| ananas | 1550258987-190a2d41a8ba |
| plantain | 1528279335935-f486951a6adf |
| mangue | 1601493700631-2b16ec4b4716 |
| orange | 1611080626919-7cf5a9dbab5b |
| pasteque | 1563114773-84221bd62daa |
| papaye | 1526318472351-c75fcf070305 |
| banane-douce | 1571771894821-ce9b6c11b08e |
| noix-de-coco | 1560769680-ba2f3767c785 |
| huile-arachide | 1757801333068-d52a3e448cde |
| huile-vegetale | 1621958180509-74e9a29b3758 |
| beurre-de-karite | 1573812461383-e5f8b759d12e |
| sucre | 1673791031093-eb8eefa60083 |
| farine-de-ble | 1627735483792-233bf632619b |
| tomate-concentree | 1472476443507-c7a5948772fc |
| spaghetti | 1556761223-4c4282c73f77 |
| refrigerateur | 1721613877687-c9099b698faa |
| congelateur | 1601599967100-f16100982063 |
| machine-a-laver | 1626806819282-2c1dc01a5e0c |
| mixeur | 1654064754916-e3edeb09c042 |
| ventilateur | 1601084195907-44baaa49dabd |
| climatiseur | 1718203862467-c33159fdc504 |
| television | 1586024486164-ce9b3d87e09f |
| micro-ondes | 1690731849383-514935755156 |
| bouilloire | 1594213114663-d94db9b17125 |
| fer-a-repasser | 1489274495757-95c7c837b101 |
| cuisiniere-a-gaz | 1607324772107-8ad6740ca195 |
| cuiseur-a-riz | 1599182345361-9542815e73f6 |
| grille-pain | 1686644823126-7ed947386b77 |
