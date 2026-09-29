"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/api";

const LINKS = [
  { href: "/backoffice/releves", label: "Relevés" },
  { href: "/backoffice/liquidite", label: "Liquidité" },
  { href: "/backoffice/vendeurs", label: "Vendeurs" },
  { href: "/backoffice/paiements", label: "Paiements" },
  { href: "/backoffice/produits", label: "Photos" },
  { href: "/backoffice/bannieres", label: "Bannières" },
];

export function StaffBar({ user, logout }: { user: AuthUser; logout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="font-display text-sm font-bold">OBP · Back-office</span>
        <nav className="ml-2 hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                pathname === l.href ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs text-ink-2">
          <span className="hidden sm:inline">{user.fullName}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/connexion-interne");
            }}
            className="rounded-full border border-line px-2.5 py-1 font-semibold"
          >
            Déconnexion
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-1.5 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
              pathname === l.href ? "bg-brand-soft text-brand" : "text-ink-2"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
