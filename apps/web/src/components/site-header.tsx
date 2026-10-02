"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartLink } from "@/components/cart-link";
import { AuthStatus } from "@/components/auth-status";
import { CURRENCIES, useCurrency, type Currency } from "@/components/currency-provider";

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

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { currency, setCurrency } = useCurrency();

  if (pathname.startsWith("/agent") || pathname.startsWith("/backoffice") || pathname.startsWith("/connexion-interne")) return null;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}#produits` : "/#produits");
  }

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
          <label className="flex flex-none items-center gap-1.5">
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

      <header className="z-30 border-b border-line bg-surface md:sticky md:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex flex-none items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-brand font-display text-xs font-extrabold tracking-tight text-on-brand sm:size-10 sm:text-sm">
              OBP
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">OBP Market</span>
          </Link>

          <form
            onSubmit={submitSearch}
            role="search"
            className="order-last flex w-full overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand md:order-none md:max-w-xl md:flex-1"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit (maïs, riz, huile…)"
              aria-label="Rechercher un produit"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <button type="submit" aria-label="Lancer la recherche" className="grid w-12 flex-none place-items-center bg-brand text-on-brand">
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4-4" />
              </svg>
            </button>
          </form>

          <div className="ml-auto flex flex-none items-center gap-2">
            <CartLink />
            <AuthStatus />
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <NavLink href="/">Boutique</NavLink>
          <NavLink href="/mon-stock">Mon stock</NavLink>
          <NavLink href="/commandes">Mes commandes</NavLink>
          <NavLink href="/vendeur">Devenir vendeur</NavLink>
        </nav>
      </header>
    </>
  );
}
