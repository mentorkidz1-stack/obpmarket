"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartLink } from "@/components/cart-link";
import { AccountMenu } from "@/components/account-menu";
import { SearchBox } from "@/components/search-box";
import { CURRENCIES, useCurrency, type Currency } from "@/components/currency-provider";
import { useUI } from "@/components/ui-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { useCatalog } from "@/lib/use-catalog";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { categories } = useCatalog(open);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-on-brand"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Toutes les catégories
        <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[0_22px_50px_-18px_rgba(21,23,43,0.45)]">
          <Link href="/boutique" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-surface-2">
            Tous les produits
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/boutique?categorie=${c.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
            >
              <span className="font-medium">{c.name}</span>
              <span className="font-mono text-xs text-ink-2">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();
  const { setNavOpen } = useUI();
  const { ids } = useWishlist();
  // Catalogue préchargé quand la page est au repos : recherche, menu, panier latéral et favoris s'ouvrent ensuite instantanément.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), 2500);
    return () => clearTimeout(t);
  }, []);
  useCatalog(warm);

  if (pathname.startsWith("/agent") || pathname.startsWith("/backoffice") || pathname.startsWith("/connexion-interne")) return null;

  return (
    <>
      <div className="bg-ink px-4 py-2 text-[12px] font-semibold text-app sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-center sm:text-left">
            Paiement sécurisé par Mobile Money et carte bancaire ·{" "}
            <Link href="/vendeur" className="underline underline-offset-2">
              Devenez vendeur sur OBP Market
            </Link>
          </p>
          <div className="hidden flex-none items-center gap-4 sm:flex">
            <Link href="/comment-ca-marche" className="hover:underline">Comment ça marche</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
            <label className="flex items-center">
              <span className="sr-only">Devise d&apos;affichage</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="cursor-pointer rounded-md border border-white/25 bg-transparent px-1.5 py-1 text-[12px] font-semibold text-app outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="text-[#15172b]">
                    {c.code === "XOF" ? "FCFA" : `${c.code} · ${c.label}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <header className="z-30 border-b border-line bg-surface md:sticky md:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-x-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid size-10 flex-none place-items-center rounded-xl border border-line lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>

          <Link href="/" className="flex flex-none items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-brand font-display text-xs font-extrabold tracking-tight text-on-brand sm:size-10 sm:text-sm">
              OBP
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">OBP Market</span>
          </Link>

          <SearchBox className="order-last w-full lg:order-none lg:max-w-xl lg:flex-1" />

          <div className="ml-auto flex flex-none items-center gap-2">
            <Link
              href="/favoris"
              aria-label={`Mes favoris (${ids.length})`}
              className="relative hidden size-10 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2 sm:grid"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" />
              </svg>
              {ids.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold leading-5 text-on-brand">
                  {ids.length}
                </span>
              )}
            </Link>
            <CartLink />
            <AccountMenu />
          </div>
        </div>

        <nav className="mx-auto hidden max-w-6xl items-center gap-1 px-6 pb-3 lg:flex">
          <CategoriesMenu />
          <div className="ml-2 flex items-center gap-0.5">
            <NavLink href="/">Accueil</NavLink>
            <NavLink href="/boutique">Boutique</NavLink>
            <NavLink href="/immobilier">Immobilier</NavLink>
            <NavLink href="/mon-stock">Mon stock</NavLink>
            <NavLink href="/commandes">Mes commandes</NavLink>
            <NavLink href="/vendeur">Devenir vendeur</NavLink>
            <NavLink href="/faq">FAQ</NavLink>
          </div>
        </nav>
      </header>
    </>
  );
}
