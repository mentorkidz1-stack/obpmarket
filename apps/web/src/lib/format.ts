export function formatFCFA(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/** Couleurs choisies par catégorie (plus lisible qu'un hachage) — repli par hachage pour une catégorie inconnue. */
const CATEGORY_PALETTE: Record<string, [string, string]> = {
  "Céréales": ["#F0C555", "#C98A14"],
  "Tubercules": ["#A9764F", "#6B4227"],
  "Huiles": ["#E7A93E", "#B4650F"],
  "Légumes": ["#EE7A63", "#C22E22"],
  "Électroménager": ["#7C93A6", "#455C6C"],
};

const FALLBACK_PALETTE: Array<[string, string]> = [
  ["#8FBF9E", "#3F7A57"],
  ["#8298A9", "#48606F"],
  ["#C9A0DC", "#7B4D96"],
];

export function categoryGradient(categoryName: string): [string, string] {
  const known = CATEGORY_PALETTE[categoryName];
  if (known) return known;

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash * 31 + categoryName.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}
