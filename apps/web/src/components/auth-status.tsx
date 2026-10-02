"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function AuthStatus() {
  const { user, ready, logout } = useAuth();

  if (!ready) return <div className="h-8 w-20" aria-hidden />;

  if (!user) {
    return (
      <Link href="/connexion" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand">
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Link href="/portefeuille" className="rounded-full border border-line px-2.5 py-1.5 font-semibold text-ink hover:bg-surface-2">
        Portefeuille
      </Link>
      <span className="hidden max-w-24 truncate text-ink-2 lg:inline">
        {user.fullName !== "Nouveau client" ? user.fullName : user.phone}
      </span>
      <button type="button" onClick={logout} className="rounded-full border border-line px-2.5 py-1.5 font-semibold text-ink hover:bg-surface-2">
        Déconnexion
      </button>
    </div>
  );
}
