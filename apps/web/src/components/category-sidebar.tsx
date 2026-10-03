import Link from "next/link";
import { categoryGradient } from "@/lib/format";
import { CATEGORY_ICON } from "@/components/product-icons";
import type { CategoryCount } from "@/components/category-tiles";

/** Navigation par catégorie à côté de la bannière, sur desktop. */
export function CategorySidebar({
  categories,
  propertyTypes = [],
}: {
  categories: CategoryCount[];
  /** Types de biens immobiliers présents, avec leur nombre d'annonces. */
  propertyTypes?: { value: string; label: string; count: number }[];
}) {
  return (
    <nav className="hidden flex-col rounded-2xl border border-line bg-surface p-2.5 lg:flex">
      <p className="flex items-center gap-2 px-2.5 pb-2 pt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Catégories
      </p>
      <Link href="/boutique" className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold hover:bg-surface-2">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-app">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </span>
        <span className="flex-1">Tous les produits</span>
      </Link>
      {categories.map((c) => {
        const [from, to] = categoryGradient(c.name);
        const iconId = CATEGORY_ICON[c.name] ?? "pi-box";
        return (
          <Link
            key={c.id}
            href={`/boutique?categorie=${c.id}`}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm hover:bg-surface-2"
          >
            <span
              className="grid size-8 flex-none place-items-center rounded-full text-white"
              style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${iconId}`} />
              </svg>
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
            <span className="flex-none font-mono text-[11px] text-ink-2">{c.count}</span>
          </Link>
        );
      })}

      {propertyTypes.length > 0 && (
        <>
          <p className="mt-2 flex items-center gap-2 border-t border-line px-2.5 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5" />
            </svg>
            Immobilier
          </p>
          {propertyTypes.map((t) => (
            <Link key={t.value} href={`/immobilier?type=${t.value}`} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm hover:bg-surface-2">
              <span className="min-w-0 flex-1 truncate font-medium">{t.label}</span>
              <span className="flex-none font-mono text-[11px] text-ink-2">{t.count}</span>
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
