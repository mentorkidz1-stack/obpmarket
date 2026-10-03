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
  { href: "/backoffice/immobilier", label: "Immobilier" },
  { href: "/backoffice/messages", label: "Messages" },
];

export function StaffBar({ user, logout }: { user: AuthUser; logout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2 font-display text-sm font-extrabold">
          <span className="grid size-8 place-items-center rounded-[9px] bg-brand text-[11px] text-on-brand">OBP</span>
          Back-office
        </span>
        <nav className="ml-2 hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${
                pathname === l.href ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"
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
            className="rounded-lg border border-line px-3 py-1.5 font-bold text-ink hover:bg-surface-2"
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
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${
              pathname === l.href ? "bg-brand text-on-brand" : "text-ink-2"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
