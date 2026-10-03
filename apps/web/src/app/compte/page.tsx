"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PageHero } from "@/components/page-hero";

const CARDS = [
  { href: "/commandes", title: "Mes commandes", text: "Suivez vos paiements et retrouvez vos bons de retrait.", icon: <><rect x="4" y="3.5" width="16" height="17" rx="2.2" /><path d="M8 8.5h8M8 12.5h8M8 16.5h5" /></> },
  { href: "/mon-stock", title: "Mon stock", text: "Vos produits en dépôt, valorisés au prix du marché.", icon: <><path d="M3.5 8.5L12 4l8.5 4.5v8L12 21l-8.5-4.5z" /><path d="M3.5 8.5L12 13l8.5-4.5M12 13v8" /></> },
  { href: "/portefeuille", title: "Portefeuille", text: "Votre solde et vos retraits vers Mobile Money.", icon: <><rect x="3" y="6" width="18" height="13" rx="2.2" /><path d="M3 10h18M16.5 14.5h.01" /></> },
  { href: "/notifications", title: "Notifications", text: "Vos alertes, ventes et suivis de commande.", icon: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" /><path d="M10 19a2 2 0 0 0 4 0" /></> },
  { href: "/alertes", title: "Alertes de prix", text: "Soyez prévenu quand un prix baisse.", icon: <><path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" /></> },
  { href: "/favoris", title: "Mes favoris", text: "Les produits que vous suivez.", icon: <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" /> },
  { href: "/vendeur", title: "Espace vendeur", text: "Publiez vos annonces et suivez leur validation.", icon: <><path d="M4 9l1.5-4.5h13L20 9" /><path d="M4 9v10.5h16V9M4 9c0 1.7 1.4 2.8 2.7 2.8S9.3 10.7 9.3 9c0 1.7 1.2 2.8 2.7 2.8s2.7-1.1 2.7-2.8c0 1.7 1.3 2.8 2.7 2.8S20 10.7 20 9" /></> },
  { href: "/contact", title: "Aide et contact", text: "Une question ? Notre équipe vous répond.", icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.2 1-1.2 1.8M12 17h.01" /></> },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/connexion");
  }, [ready, user, router]);

  if (!user) return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;

  const name = user.fullName && user.fullName !== "Nouveau client" ? user.fullName : null;
  const badge = name
    ? name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user.phone.replace(/\D/g, "").slice(-2);

  return (
    <>
      <PageHero title="Mon compte" crumb="Compte" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand p-6 text-on-brand">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/20 font-display text-lg font-extrabold">
              {badge}
            </span>
            <div>
              <p className="font-display text-xl font-extrabold">{name ?? "Bienvenue"}</p>
              <p className="font-mono text-sm opacity-85">{user.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand"
          >
            Déconnexion
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-on-brand">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
              </span>
              <p className="mt-4 font-display font-bold">{c.title}</p>
              <p className="mt-1 text-sm text-ink-2">{c.text}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
