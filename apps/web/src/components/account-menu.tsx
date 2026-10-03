"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const LINKS = [
  { href: "/compte", label: "Mon compte" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/mon-stock", label: "Mon stock" },
  { href: "/portefeuille", label: "Portefeuille" },
  { href: "/favoris", label: "Mes favoris" },
  { href: "/vendeur", label: "Espace vendeur" },
];

function initials(name: string, phone: string) {
  if (!name || name === "Nouveau client") return phone.replace(/\D/g, "").slice(-2);
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AccountMenu() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!ready) return <div className="size-10" aria-hidden />;

  if (!user) {
    return (
      <Link href="/connexion" className="flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-bold text-on-brand sm:px-4">
        <svg viewBox="0 0 24 24" className="size-4.5 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20c.6-3.6 3.5-5.5 7-5.5s6.4 1.9 7 5.5" />
        </svg>
        <span className="hidden sm:inline">Se connecter</span>
      </Link>
    );
  }

  const display = user.fullName && user.fullName !== "Nouveau client" ? user.fullName : user.phone;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3 hover:bg-surface-2"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-brand font-display text-xs font-extrabold text-on-brand">
          {initials(user.fullName, user.phone)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">{display}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_22px_50px_-18px_rgba(21,23,43,0.45)]">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-bold">{display}</p>
            <p className="font-mono text-xs text-ink-2">{user.phone}</p>
          </div>
          <nav className="p-1.5">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} role="menuitem" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
              router.push("/");
            }}
            className="w-full border-t border-line px-4 py-3 text-left text-sm font-bold text-down hover:bg-surface-2"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
