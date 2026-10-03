/**
 * Annonces immobilières d'EXEMPLE (photos libres de droits dans apps/web/public/immobilier).
 *
 *   npm run seed:properties     → (re)crée les exemples
 *   npm run unseed:properties   → les supprime (avant de publier les vrais biens)
 *
 * Les exemples se reconnaissent à la mention finale de leur description.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MARK = "Annonce d'exemple — à remplacer par vos vrais biens.";
const M2 = { M2: 1, ARE: 100, HECTARE: 10_000 } as const;
const img = (...names: string[]) => names.map((n) => `/immobilier/${n}.jpg`);

type Example = {
  title: string;
  type: 'PARCELLE' | 'MAISON' | 'APPARTEMENT' | 'CHAMBRE' | 'GUEST_HOUSE' | 'LOCAL_COMMERCIAL' | 'TERRAIN_AGRICOLE';
  kind: 'VENTE' | 'LOCATION';
  status?: 'DISPONIBLE' | 'RESERVE' | 'CONCLU';
  featured?: boolean;
  city: string;
  district?: string;
  areaValue?: number;
  areaUnit?: keyof typeof M2;
  bedrooms?: number;
  bathrooms?: number;
  titleDeed?: string;
  price: number;
  rentPeriod?: 'NUIT' | 'MOIS' | 'AN';
  negotiable?: boolean;
  description: string;
  photos: string[];
};

const EXAMPLES: Example[] = [
  {
    title: 'Villa de standing avec piscine à Fidjrossè',
    type: 'MAISON',
    kind: 'VENTE',
    featured: true,
    city: 'Cotonou',
    district: 'Fidjrossè',
    areaValue: 450,
    bedrooms: 4,
    bathrooms: 5,
    titleDeed: 'Titre foncier',
    price: 185_000_000,
    negotiable: true,
    description:
      "Belle villa contemporaine sur un terrain clôturé de 450 m², à quelques minutes de la plage.\nSalon double, cuisine équipée, 4 chambres dont une suite parentale, piscine et jardin, garage pour 3 véhicules.\nQuartier calme et sécurisé.",
    photos: img('villa-piscine-1', 'villa-piscine-2', 'villa-piscine-3'),
  },
  {
    title: 'Maison moderne 3 chambres à Togba',
    type: 'MAISON',
    kind: 'VENTE',
    city: 'Abomey-Calavi',
    district: 'Togba',
    areaValue: 300,
    bedrooms: 3,
    bathrooms: 3,
    titleDeed: 'Titre foncier',
    price: 65_000_000,
    description:
      "Maison neuve de plain-pied sur 300 m², finitions modernes : carrelage, plafond staff, forage et château d'eau.\nSalon, cuisine, 3 chambres avec douche, grande cour. Accès par route bitumée.",
    photos: img('maison-moderne-1', 'maison-moderne-2'),
  },
  {
    title: 'Maison familiale 2 chambres à Porto-Novo',
    type: 'MAISON',
    kind: 'VENTE',
    status: 'CONCLU',
    city: 'Porto-Novo',
    district: 'Ouando',
    areaValue: 250,
    bedrooms: 2,
    bathrooms: 1,
    titleDeed: "Permis d'habiter",
    price: 32_000_000,
    description: "Maison bien entretenue sur 250 m², cour intérieure et petite dépendance. Proche du marché et des écoles.",
    photos: img('maison-1', 'maison-2'),
  },
  {
    title: 'Appartement 3 pièces meublé à Cadjehoun',
    type: 'APPARTEMENT',
    kind: 'LOCATION',
    rentPeriod: 'MOIS',
    city: 'Cotonou',
    district: 'Cadjehoun',
    areaValue: 95,
    bedrooms: 2,
    bathrooms: 2,
    price: 350_000,
    negotiable: true,
    description:
      "Appartement lumineux au 2e étage, entièrement meublé et climatisé : salon, cuisine équipée, 2 chambres, balcon.\nGroupe électrogène et eau courante, gardiennage. Idéal pour cadre ou expatrié.",
    photos: img('appartement-1', 'appartement-2', 'appartement-3'),
  },
  {
    title: 'Chambre meublée climatisée à Akpakpa',
    type: 'CHAMBRE',
    kind: 'LOCATION',
    rentPeriod: 'MOIS',
    city: 'Cotonou',
    district: 'Akpakpa',
    areaValue: 20,
    bedrooms: 1,
    bathrooms: 1,
    price: 60_000,
    description: "Chambre indépendante avec douche privée, climatisation et lit double, dans une résidence calme. Eau et électricité compteur individuel.",
    photos: img('chambre-1', 'chambre-2'),
  },
  {
    title: 'Guest house de 8 chambres à Grand-Popo',
    type: 'GUEST_HOUSE',
    kind: 'VENTE',
    featured: true,
    city: 'Grand-Popo',
    district: 'Bord de mer',
    areaValue: 6,
    areaUnit: 'ARE',
    bedrooms: 8,
    bathrooms: 8,
    titleDeed: 'Titre foncier',
    price: 95_000_000,
    negotiable: true,
    description:
      "Guest house en activité sur 6 ares, à 200 m de la plage : 8 chambres climatisées, salle de restaurant, bar, terrasse et parking.\nClientèle régulière, possibilité de reprise avec le mobilier.",
    photos: img('guesthouse-1', 'guesthouse-2', 'guesthouse-3'),
  },
  {
    title: 'Chambre de guest house avec petit-déjeuner à Ouidah',
    type: 'GUEST_HOUSE',
    kind: 'LOCATION',
    rentPeriod: 'NUIT',
    city: 'Ouidah',
    district: 'Centre historique',
    areaValue: 25,
    bedrooms: 1,
    bathrooms: 1,
    price: 25_000,
    description: "Chambre double climatisée avec salle d'eau, Wi-Fi et petit-déjeuner inclus. À pied de la Route des Esclaves et du musée d'histoire.",
    photos: img('guesthouse-4', 'guesthouse-5'),
  },
  {
    title: 'Parcelle de 500 m² à Godomey',
    type: 'PARCELLE',
    kind: 'VENTE',
    status: 'RESERVE',
    city: 'Abomey-Calavi',
    district: 'Godomey',
    areaValue: 500,
    titleDeed: 'Convention de vente',
    price: 8_500_000,
    negotiable: true,
    description: "Parcelle plane et bien située, à 300 m de la route principale. Électricité et eau à proximité. Bornage disponible.",
    photos: img('parcelle-1', 'parcelle-2'),
  },
  {
    title: 'Parcelle de 1 000 m² à Zinvié',
    type: 'PARCELLE',
    kind: 'VENTE',
    featured: true,
    city: 'Abomey-Calavi',
    district: 'Zinvié',
    areaValue: 1000,
    titleDeed: 'Titre foncier',
    price: 15_000_000,
    description: "Grande parcelle en lotissement viabilisé, idéale pour une villa ou un petit immeuble. Titre foncier individuel disponible.",
    photos: img('parcelle-3', 'parcelle-4'),
  },
  {
    title: 'Parcelle de 4 ares à Parakou',
    type: 'PARCELLE',
    kind: 'VENTE',
    city: 'Parakou',
    district: 'Banikanni',
    areaValue: 4,
    areaUnit: 'ARE',
    titleDeed: 'Attestation de recasement',
    price: 6_000_000,
    description: "Parcelle de 4 ares (400 m²) dans un quartier résidentiel en développement, voies tracées et accès facile.",
    photos: img('parcelle-4'),
  },
  {
    title: 'Terrain agricole de 1 hectare à Allada',
    type: 'TERRAIN_AGRICOLE',
    kind: 'VENTE',
    featured: true,
    city: 'Allada',
    district: 'Agbanou',
    areaValue: 1,
    areaUnit: 'HECTARE',
    titleDeed: 'Titre foncier',
    price: 12_000_000,
    negotiable: true,
    description: "Terrain plat et fertile, accès par piste carrossable. Convient au maraîchage, au manioc ou au palmier à huile. Point d'eau à proximité.",
    photos: img('agricole-1', 'agricole-2'),
  },
  {
    title: 'Terrain agricole de 5 hectares à Bohicon',
    type: 'TERRAIN_AGRICOLE',
    kind: 'VENTE',
    city: 'Bohicon',
    district: 'Lissèzoun',
    areaValue: 5,
    areaUnit: 'HECTARE',
    titleDeed: 'Convention de vente',
    price: 28_000_000,
    description: "Vaste terrain d'un seul tenant, idéal pour une exploitation agricole ou un projet agro-industriel. Sol argilo-sableux, accès par la route inter-États.",
    photos: img('agricole-3', 'agricole-4'),
  },
  {
    title: 'Local commercial de 40 m² à Missèbo',
    type: 'LOCAL_COMMERCIAL',
    kind: 'LOCATION',
    rentPeriod: 'MOIS',
    city: 'Cotonou',
    district: 'Missèbo',
    areaValue: 40,
    price: 250_000,
    description: "Boutique en rez-de-chaussée sur rue passante, rideau métallique, électricité et point d'eau. Forte affluence toute la journée.",
    photos: img('local-1', 'local-2'),
  },
];

async function main() {
  const mode = process.argv[2];
  const removed = await prisma.property.deleteMany({ where: { description: { contains: MARK } } });
  if (mode === 'remove') {
    console.log(`${removed.count} annonce(s) d'exemple supprimée(s).`);
    return;
  }

  for (const [i, e] of EXAMPLES.entries()) {
    const unit = e.areaUnit ?? 'M2';
    await prisma.property.create({
      data: {
        title: e.title,
        type: e.type,
        kind: e.kind,
        status: e.status ?? 'DISPONIBLE',
        featured: e.featured ?? false,
        city: e.city,
        district: e.district ?? null,
        areaValue: e.areaValue ?? null,
        areaUnit: unit,
        areaM2: e.areaValue != null ? Math.round(e.areaValue * M2[unit] * 100) / 100 : null,
        bedrooms: e.bedrooms ?? null,
        bathrooms: e.bathrooms ?? null,
        titleDeed: e.titleDeed ?? null,
        price: e.price,
        rentPeriod: e.kind === 'LOCATION' ? (e.rentPeriod ?? 'MOIS') : null,
        negotiable: e.negotiable ?? false,
        description: `${e.description}\n\n${MARK}`,
        photos: JSON.stringify(e.photos),
        // Ordre d'affichage stable : le premier de la liste est le plus récent.
        createdAt: new Date(Date.now() - i * 60_000),
      },
    });
  }
  console.log(`${removed.count} ancien(s) exemple(s) remplacé(s), ${EXAMPLES.length} annonce(s) d'exemple créée(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
