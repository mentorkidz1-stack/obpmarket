"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartLink } from "@/components/cart-link";
import { AuthStatus } from "@/components/auth-status";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/agent") || pathname.startsWith("/backoffice") || pathname.startsWith("/connexion-interne")) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="bg-ink px-4 py-1.5 text-center text-[11px] font-semibold text-app sm:px-6">
        Paiement sécurisé par Mobile Money et carte bancaire ·{" "}
        <Link href="/vendeur" className="underline underline-offset-2">
          Devenez vendeur sur OBP Market
        </Link>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex flex-none items-center gap-2">
          <div className="grid size-9 place-items-center rounded-[10px] bg-brand font-display text-sm font-extrabold tracking-tight text-on-brand">
            OBP
          </div>
          <span className="hidden font-display text-lg font-bold sm:inline">OBP Market</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          <NavLink href="/">Boutique</NavLink>
          <NavLink href="/mon-stock">Mon stock</NavLink>
          <NavLink href="/commandes">Mes commandes</NavLink>
          <NavLink href="/vendeur">Devenir vendeur</NavLink>
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2">
          <CartLink />
          <AuthStatus />
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        <NavLink href="/">Boutique</NavLink>
        <NavLink href="/mon-stock">Mon stock</NavLink>
        <NavLink href="/commandes">Commandes</NavLink>
        <NavLink href="/vendeur">Vendeur</NavLink>
      </nav>
    </header>
  );
}
