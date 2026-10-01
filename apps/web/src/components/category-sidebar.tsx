import Link from "next/link";
import { categoryGradient } from "@/lib/format";
import { CATEGORY_ICON } from "@/components/product-icons";
import type { CategoryCount } from "@/components/category-tiles";

/** Liste de navigation par catégorie, à côté du carrousel de bannières sur desktop. */
export function CategorySidebar({ categories }: { categories: CategoryCount[] }) {
  return (
    <nav className="hidden rounded-2xl border border-line bg-surface p-2 lg:block">
      <Link
        href="#produits"
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold hover:bg-surface-2"
      >
        <span className="grid size-7 flex-none place-items-center rounded-full bg-ink text-app">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </span>
        Tous les produits
      </Link>
      {categories.map((c) => {
        const [from, to] = categoryGradient(c.name);
        const iconId = CATEGORY_ICON[c.name] ?? "pi-box";
        return (
          <Link
            key={c.id}
            href={`/?categorie=${c.id}#produits`}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-surface-2"
          >
            <span
              className="grid size-7 flex-none place-items-center rounded-full text-white"
              style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${iconId}`} />
              </svg>
            </span>
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="flex-none font-mono text-[11px] text-ink-2">{c.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
