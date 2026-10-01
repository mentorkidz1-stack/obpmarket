import Link from "next/link";
import { categoryGradient } from "@/lib/format";
import { CATEGORY_ICON } from "@/components/product-icons";

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

export function CategoryStrip({ categories }: { categories: CategoryCount[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <Link
          href="#produits"
          className="grid flex-none place-items-center gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3 text-center transition-colors hover:border-brand"
        >
          <div className="grid size-10 place-items-center rounded-full bg-ink text-app">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <span className="whitespace-nowrap text-xs font-semibold">Tout</span>
        </Link>

        {categories.map((c) => {
          const [from, to] = categoryGradient(c.name);
          const iconId = CATEGORY_ICON[c.name] ?? "pi-box";
          return (
            <Link
              key={c.id}
              href={`/?categorie=${c.id}#produits`}
              className="grid flex-none place-items-center gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3 text-center transition-colors hover:border-brand"
            >
              <div
                className="grid size-10 place-items-center rounded-full text-white"
                style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <use href={`#${iconId}`} />
                </svg>
              </div>
              <span className="whitespace-nowrap text-xs font-semibold">{c.name}</span>
              <span className="whitespace-nowrap font-mono text-[10px] text-ink-2">{c.count} produit{c.count > 1 ? "s" : ""}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
