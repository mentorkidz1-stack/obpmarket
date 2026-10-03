"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getContactMessages,
  getPaymentQueue,
  getPendingLiquidityRequests,
  getPendingVendorListings,
  getPendingVendors,
  getPropertyInquiries,
  getReadingsToReview,
} from "@/lib/api";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

interface Task {
  href: string;
  title: string;
  hint: string;
  roles: string[];
  load: (token: string) => Promise<number>;
}

const TASKS: Task[] = [
  {
    href: "/backoffice/releves",
    title: "Relevés de prix à valider",
    hint: "Relevés signalés par le contrôle automatique.",
    roles: ["GESTIONNAIRE_PRIX", "ADMIN"],
    load: async (t) => (await getReadingsToReview(t)).length,
  },
  {
    href: "/backoffice/paiements",
    title: "Paiements à vérifier",
    hint: "Paiements manuels en attente de confirmation.",
    roles: ["GESTIONNAIRE_LIQUIDITE", "ADMIN"],
    load: async (t) => (await getPaymentQueue(t)).length,
  },
  {
    href: "/backoffice/liquidite",
    title: "Demandes de liquidité",
    hint: "Clients qui demandent une offre de rachat.",
    roles: ["GESTIONNAIRE_LIQUIDITE", "ADMIN"],
    load: async (t) => (await getPendingLiquidityRequests(t)).length,
  },
  {
    href: "/backoffice/vendeurs",
    title: "Vendeurs et annonces à valider",
    hint: "Comptes vendeurs et annonces en attente de modération.",
    roles: ["MODERATEUR", "ADMIN"],
    load: async (t) => (await getPendingVendors(t)).length + (await getPendingVendorListings(t)).length,
  },
  {
    href: "/backoffice/immobilier",
    title: "Demandes de visite à rappeler",
    hint: "Clients intéressés par un bien immobilier.",
    roles: ["MODERATEUR", "ADMIN"],
    load: async (t) => (await getPropertyInquiries(t)).filter((i) => i.status === "NOUVEAU").length,
  },
  {
    href: "/backoffice/messages",
    title: "Messages à traiter",
    hint: "Messages envoyés depuis la page Contact.",
    roles: ["MODERATEUR", "ADMIN"],
    load: async (t) => (await getContactMessages(t)).filter((m) => m.status === "NOUVEAU").length,
  },
];

const SHORTCUTS = [
  { href: "/backoffice/produits", label: "Photos du catalogue", roles: ["GESTIONNAIRE_PRIX", "ADMIN"] },
  { href: "/backoffice/bannieres", label: "Bannières de l'accueil", roles: ["MODERATEUR", "ADMIN"] },
  { href: "/backoffice/immobilier", label: "Publier un bien immobilier", roles: ["MODERATEUR", "ADMIN"] },
];

const ALL_ROLES = ["GESTIONNAIRE_PRIX", "GESTIONNAIRE_LIQUIDITE", "MODERATEUR", "ADMIN"];

export default function BackofficeHome() {
  const { user, token, authorized, logout } = useStaffSession(ALL_ROLES);
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const mine = TASKS.filter((t) => user && t.roles.includes(user.role));

  useEffect(() => {
    if (!token || !user) return;
    for (const t of TASKS.filter((x) => x.roles.includes(user.role))) {
      t.load(token)
        .then((n) => setCounts((c) => ({ ...c, [t.href + t.title]: n })))
        .catch(() => setCounts((c) => ({ ...c, [t.href + t.title]: null })));
    }
  }, [token, user]);

  if (!authorized || !user) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-ink-2">Voici ce qui vous attend aujourd&apos;hui.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {mine.map((t) => {
            const n = counts[t.href + t.title];
            return (
              <Link
                key={t.href + t.title}
                href={t.href}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)] ${n ? "border-brand/50 bg-surface" : "border-line bg-surface"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display font-bold">{t.title}</p>
                  <span className={`min-w-9 rounded-full px-2.5 py-1 text-center font-mono text-sm font-bold ${n ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-2"}`}>
                    {n === undefined ? "…" : n === null ? "—" : n}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{t.hint}</p>
              </Link>
            );
          })}
        </div>

        <h2 className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Raccourcis</h2>
        <div className="flex flex-wrap gap-2">
          {SHORTCUTS.filter((s) => s.roles.includes(user.role)).map((s) => (
            <Link key={s.href} href={s.href} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2">
              {s.label}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
