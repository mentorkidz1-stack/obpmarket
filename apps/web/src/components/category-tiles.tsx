import Link from "next/link";
import { categoryGradient } from "@/lib/format";
import { CATEGORY_ICON } from "@/components/product-icons";

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

/** Grand bandeau de tuiles catégories, coloré — vitrine principale d'achat par rayon. */
export function CategoryTiles({ categories }: { categories: CategoryCount[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold">Acheter par catégorie</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((c) => {
          const [from, to] = categoryGradient(c.name);
          const iconId = CATEGORY_ICON[c.name] ?? "pi-box";
          return (
            <Link
              key={c.id}
              href={`/?categorie=${c.id}#produits`}
              className="group relative overflow-hidden rounded-2xl p-4 text-white transition-transform hover:-translate-y-0.5"
              style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
            >
              <svg
                viewBox="0 0 24 24"
                className="absolute -bottom-3 -right-3 size-20 text-white opacity-20 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <use href={`#${iconId}`} />
              </svg>
              <p className="relative font-display text-lg font-bold leading-tight">{c.name}</p>
              <p className="relative mt-1 text-xs text-white/85">
                {c.count} produit{c.count > 1 ? "s" : ""}
              </p>
              <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                Voir
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
