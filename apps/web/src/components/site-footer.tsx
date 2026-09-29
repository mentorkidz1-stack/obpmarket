"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/agent") || pathname.startsWith("/backoffice") || pathname.startsWith("/connexion-interne")) return null;

  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-[9px] bg-brand font-display text-xs font-extrabold text-on-brand">
              OBP
            </div>
            <span className="font-display font-bold">OBP Market</span>
          </div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-2">
            Le prix moyen des marchés du Bénin, calculé à partir de relevés de terrain, pour acheter, déposer et
            revendre au prix juste.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Acheter</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            <li><Link href="/" className="text-ink-2 hover:text-ink">Prix du jour</Link></li>
            <li><Link href="/panier" className="text-ink-2 hover:text-ink">Mon panier</Link></li>
            <li><Link href="/commandes" className="text-ink-2 hover:text-ink">Mes commandes</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Gérer mon stock</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            <li><Link href="/mon-stock" className="text-ink-2 hover:text-ink">Mon stock</Link></li>
            <li><Link href="/portefeuille" className="text-ink-2 hover:text-ink">Portefeuille</Link></li>
            <li><Link href="/vendeur" className="text-ink-2 hover:text-ink">Devenir vendeur</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-[11px] text-ink-2 sm:px-6">
        OBP Market · Bénin — plateforme en développement, prix et produits d&apos;exemple.
      </p>
    </footer>
  );
}
