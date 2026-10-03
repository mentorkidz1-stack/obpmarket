import Link from "next/link";
import { Photo } from "@/components/photo";
import { CATEGORY_ICON } from "@/components/product-icons";

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
  /** Photo réelle du premier produit de la catégorie qui en a une. */
  photo?: string;
}

const PASTEL: Record<string, { bg: string; fg: string }> = {
  "Céréales": { bg: "#fdf0c9", fg: "#6b4a00" },
  "Huiles": { bg: "#ffe5cf", fg: "#7a3a0c" },
  "Légumes": { bg: "#fddedb", fg: "#8a241b" },
  "Tubercules": { bg: "#ecdfd5", fg: "#58381f" },
  "Électroménager": { bg: "#dde8f2", fg: "#27455e" },
};
const FALLBACK = { bg: "#e8ebfb", fg: "#2b3fae" };

/** Tuiles pastel « Acheter par catégorie », avec la vraie photo d'un produit du rayon. */
export function CategoryTiles({
  categories,
  realEstate,
}: {
  categories: CategoryCount[];
  /** Tuile large « Immobilier », au même niveau que les rayons de la boutique. */
  realEstate?: { count: number; photo?: string };
}) {
  if (categories.length === 0 && !realEstate) return null;

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold">Acheter par catégorie</h2>
        <Link href="/boutique" className="flex-none text-sm font-semibold text-brand">
          Tous les produits
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((c) => {
          const colors = PASTEL[c.name] ?? FALLBACK;
          const iconId = CATEGORY_ICON[c.name] ?? "pi-box";
          return (
            <Link
              key={c.id}
              href={`/boutique?categorie=${c.id}`}
              className="group relative min-h-40 overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5 sm:min-h-44 sm:p-5"
              style={{ background: colors.bg, color: colors.fg }}
            >
              <p className="relative max-w-[55%] font-display text-lg font-extrabold leading-tight sm:text-xl">{c.name}</p>
              <p className="relative mt-1 text-xs font-semibold opacity-75">
                {c.count} produit{c.count > 1 ? "s" : ""}
              </p>
              <span className="relative mt-4 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4">
                Acheter
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              {c.photo ? (
                <span className="absolute bottom-0 right-0 h-[78%] w-[46%] overflow-hidden rounded-tl-[36px]">
                  <Photo src={c.photo} alt="" sizes="160px" quality={60} className="transition-transform duration-300 group-hover:scale-105" />
                </span>
              ) : (
                <svg viewBox="0 0 24 24" className="absolute -bottom-2 -right-2 size-24 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <use href={`#${iconId}`} />
                </svg>
              )}
            </Link>
          );
        })}

        {realEstate && (
          <Link
            href="/immobilier"
            className="group relative col-span-2 min-h-40 overflow-hidden rounded-2xl bg-[#15172b] p-5 text-white transition-transform hover:-translate-y-0.5 sm:min-h-44 sm:p-6 lg:col-span-4"
          >
            <div className="relative max-w-[60%] sm:max-w-[50%]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Immobilier</p>
              <p className="mt-1 font-display text-xl font-extrabold leading-tight sm:text-2xl">Parcelles, maisons, chambres et guest houses</p>
              <p className="mt-1.5 text-xs font-semibold text-white/75">
                {realEstate.count > 0 ? `${realEstate.count} annonce${realEstate.count > 1 ? "s" : ""} à vendre ou à louer` : "À vendre ou à louer"}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4">
                Découvrir les annonces
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
            {realEstate.photo && (
              <span className="absolute inset-y-0 right-0 w-[42%] overflow-hidden rounded-l-[40px]">
                <Photo src={realEstate.photo} alt="" sizes="(max-width: 1024px) 45vw, 420px" quality={60} className="transition-transform duration-300 group-hover:scale-105" />
              </span>
            )}
          </Link>
        )}
      </div>
    </section>
  );
}
