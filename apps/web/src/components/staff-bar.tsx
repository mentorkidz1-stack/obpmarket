"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/api";
import { navFor, ROLE_LABEL } from "@/lib/staff-nav";
import { LogoMark } from "@/components/logo";

export function StaffBar({ user, logout }: { user: AuthUser; logout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = navFor(user.role);
  // Un menu ouvert est lié à la page où il a été ouvert : changer de page le referme.
  const [openAt, setOpenAt] = useState<{ key: string | null; path: string; mobile: boolean }>({ key: null, path: pathname, mobile: false });
  const current = openAt.path === pathname ? openAt : { key: null, path: pathname, mobile: false };
  const open = current.key;
  const mobile = current.mobile;
  const setOpen = (key: string | null) => setOpenAt({ key, path: pathname, mobile });
  const setMobile = (value: boolean | ((m: boolean) => boolean)) =>
    setOpenAt({ key: null, path: pathname, mobile: typeof value === "function" ? value(mobile) : value });
  const bar = useRef<HTMLElement>(null);

  // Ferme aussi les menus au clic à l'extérieur et avec Échap.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (bar.current && !bar.current.contains(e.target as Node)) setOpenAt((s) => ({ ...s, key: null }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt({ key: null, path: pathname, mobile: false });
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pathname]);

  function signOut() {
    logout();
    router.replace("/connexion-interne");
  }

  const link = (active: boolean) =>
    `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface-2"}`;

  return (
    <header ref={bar} className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6">
        <Link href="/backoffice" className="flex items-center gap-2 font-display text-sm font-extrabold">
          <LogoMark className="size-8" />
          <span className="hidden sm:inline">Back-office</span>
        </Link>

        <nav className="ml-3 hidden flex-1 items-center gap-1 md:flex" aria-label="Navigation du back-office">
          <Link href="/backoffice" className={`rounded-lg px-3 py-1.5 text-xs font-bold ${pathname === "/backoffice" ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"}`}>
            Tableau de bord
          </Link>
          {groups.map((g) => {
            const active = g.items.some((i) => pathname.startsWith(i.href));
            return (
              <div key={g.label} className="relative">
                <button
                  type="button"
                  aria-expanded={open === g.label}
                  onClick={() => setOpen(open === g.label ? null : g.label)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${active ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"}`}
                >
                  {g.label}
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {open === g.label && (
                  <div className="absolute left-0 top-full mt-1.5 grid min-w-56 gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-[0_18px_40px_-16px_rgba(21,23,43,0.4)]">
                    {g.items.map((i) => (
                      <Link key={i.href} href={i.href} className={link(pathname.startsWith(i.href))}>
                        {i.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="relative ml-auto flex items-center gap-2 text-xs text-ink-2">
          <button
            type="button"
            aria-expanded={open === "__me"}
            onClick={() => setOpen(open === "__me" ? null : "__me")}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 font-bold text-ink hover:bg-surface-2"
          >
            <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] text-on-brand">{user.fullName.charAt(0).toUpperCase()}</span>
            <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
          </button>
          {open === "__me" && (
            <div className="absolute right-0 top-full mt-1.5 grid min-w-56 gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-[0_18px_40px_-16px_rgba(21,23,43,0.4)]">
              <p className="px-3 py-2 text-[11px] text-ink-2">
                {user.fullName}
                <br />
                <span className="font-semibold text-ink">{ROLE_LABEL[user.role] ?? user.role}</span>
              </p>
              <Link href="/backoffice/mon-compte" className={link(pathname === "/backoffice/mon-compte")}>
                Mon compte et mot de passe
              </Link>
              <Link href="/" className={link(false)}>
                Voir la boutique
              </Link>
              <button type="button" onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-down hover:bg-down/10">
                Déconnexion
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
            className="grid size-9 place-items-center rounded-lg border border-line md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={mobile ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {mobile && (
        <nav className="max-h-[70vh] overflow-y-auto border-t border-line px-4 pb-4 pt-2 md:hidden" aria-label="Navigation du back-office">
          <Link href="/backoffice" className={link(pathname === "/backoffice")}>
            Tableau de bord
          </Link>
          {groups.map((g) => (
            <div key={g.label} className="mt-2">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-2">{g.label}</p>
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className={link(pathname.startsWith(i.href))}>
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}

