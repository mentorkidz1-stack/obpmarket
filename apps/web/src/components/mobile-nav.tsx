"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useUI } from "@/components/ui-provider";
import { Logo } from "@/components/logo";
import { useCatalog } from "@/lib/use-catalog";
import { PROPERTY_TYPES } from "@/lib/property";
import { CURRENCIES, useCurrency, type Currency } from "@/components/currency-provider";

const PAGES = [
  { href: "/boutique", label: "Boutique" },
  { href: "/immobilier", label: "Immobilier" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/mon-stock", label: "Mon stock" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/favoris", label: "Mes favoris" },
  { href: "/vendeur", label: "Devenir vendeur" },
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/contact", label: "Contact" },
];

/** Menu latéral mobile : pages, catégories et devise. */
export function MobileNav() {
  const { navOpen, setNavOpen } = useUI();
  const pathname = usePathname();
  const { categories, properties } = useCatalog(navOpen);
  const propertyTypes = PROPERTY_TYPES.flatMap((t) => {
    const count = properties.filter((p) => p.type === t.value).length;
    return count > 0 ? [{ value: t.value, label: t.plural, count }] : [];
  });
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  return (
    <div className={`fixed inset-0 z-[60] lg:hidden ${navOpen ? "" : "pointer-events-none"}`} aria-hidden={!navOpen}>
      <div onClick={() => setNavOpen(false)} className={`absolute inset-0 bg-[#0b0d20]/55 transition-opacity duration-300 ${navOpen ? "opacity-100" : "opacity-0"}`} />
      <aside
        className={`absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-surface shadow-2xl transition-transform duration-300 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo markClassName="size-9" textClassName="text-lg" />
          <button type="button" onClick={() => setNavOpen(false)} aria-label="Fermer le menu" className="grid size-9 place-items-center rounded-full hover:bg-surface-2">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <nav className="p-3">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`block rounded-xl px-4 py-3 text-[15px] font-semibold ${pathname === p.href ? "bg-brand-soft text-brand" : "hover:bg-surface-2"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {categories.length > 0 && (
          <div className="border-t border-line p-3">
            <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Catégories</p>
            {categories.map((c) => (
              <Link key={c.id} href={`/boutique?categorie=${c.id}`} className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm hover:bg-surface-2">
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-xs text-ink-2">{c.count}</span>
              </Link>
            ))}
          </div>
        )}

        {propertyTypes.length > 0 && (
          <div className="border-t border-line p-3">
            <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Immobilier</p>
            {propertyTypes.map((t) => (
              <Link key={t.value} href={`/immobilier?type=${t.value}`} className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm hover:bg-surface-2">
                <span className="font-medium">{t.label}</span>
                <span className="font-mono text-xs text-ink-2">{t.count}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-line p-5">
          <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2" htmlFor="mobile-currency">
            Devise d&apos;affichage
          </label>
          <select
            id="mobile-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code === "XOF" ? "FCFA" : `${c.code} · ${c.label}`}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </div>
  );
}
