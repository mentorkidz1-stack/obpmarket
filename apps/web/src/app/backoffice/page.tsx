"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, type AdminStats } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { ALL_STAFF_ROLES, ROLE_LABEL } from "@/lib/staff-nav";
import { BackofficePage, Notice } from "@/components/backoffice-page";

interface Task {
  key: keyof AdminStats["todo"];
  href: string;
  title: string;
  hint: string;
  roles: string[];
}

const TASKS: Task[] = [
  { key: "pendingPayments", href: "/backoffice/paiements", title: "Paiements à vérifier", hint: "Paiements Mobile Money déclarés par les clients.", roles: ["GESTIONNAIRE_LIQUIDITE", "ADMIN"] },
  { key: "toWithdraw", href: "/backoffice/retrait", title: "Retraits en magasin", hint: "Commandes payées, en attente de retrait.", roles: ["GESTIONNAIRE_LIQUIDITE", "AGENT_MAGASIN", "ADMIN"] },
  { key: "readingsToReview", href: "/backoffice/releves", title: "Relevés de prix à valider", hint: "Relevés signalés par le contrôle automatique.", roles: ["GESTIONNAIRE_PRIX", "ADMIN"] },
  { key: "liquidityPending", href: "/backoffice/liquidite", title: "Demandes de liquidité", hint: "Clients qui demandent une offre de rachat.", roles: ["GESTIONNAIRE_LIQUIDITE", "ADMIN"] },
  { key: "vendorsToValidate", href: "/backoffice/vendeurs", title: "Vendeurs à valider", hint: "Comptes vendeurs en attente de modération.", roles: ["MODERATEUR", "ADMIN"] },
  { key: "listingsToReview", href: "/backoffice/vendeurs", title: "Annonces à modérer", hint: "Annonces vendeurs en attente de validation.", roles: ["MODERATEUR", "ADMIN"] },
  { key: "propertyInquiries", href: "/backoffice/immobilier", title: "Demandes de visite", hint: "Clients intéressés par un bien immobilier.", roles: ["MODERATEUR", "ADMIN"] },
  { key: "contactMessages", href: "/backoffice/messages", title: "Messages à traiter", hint: "Messages envoyés depuis la page Contact.", roles: ["MODERATEUR", "ADMIN"] },
];

const STATUS_LABEL: Record<string, string> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  EN_VERIFICATION: "Paiement à vérifier",
  PAYEE: "Payées, à retirer",
  RETIREE: "Retirées",
  ANNULEE: "Annulées",
};

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-2">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

function RevenueChart({ series }: { series: AdminStats["series"] }) {
  const max = Math.max(1, ...series.map((s) => s.revenue));
  return (
    <div>
      <div className="flex h-32 items-end gap-1" role="img" aria-label="Chiffre d'affaires des 14 derniers jours">
        {series.map((s) => (
          <div key={s.date} className="group relative flex-1" title={`${new Date(s.date).toLocaleDateString("fr-FR")} · ${formatFCFA(s.revenue)} F · ${s.orders} commande(s)`}>
            <div
              className={`w-full rounded-t ${s.revenue > 0 ? "bg-brand" : "bg-surface-2"}`}
              style={{ height: `${Math.max(4, (s.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-ink-2">
        <span>{series[0] ? new Date(series[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

function Dashboard({ token, role }: { token: string; role: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdminStats(token)
      .then((s) => {
        setStats(s);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const mine = TASKS.filter((t) => t.roles.includes(role));
  const isAdmin = role === "ADMIN";
  const showSales = role === "ADMIN" || role === "GESTIONNAIRE_LIQUIDITE";
  const showPrices = role === "ADMIN" || role === "GESTIONNAIRE_PRIX";
  const showStock = role === "ADMIN" || role === "GESTIONNAIRE_LIQUIDITE" || role === "AGENT_MAGASIN";
  const pending = stats ? mine.reduce((n, t) => n + stats.todo[t.key], 0) : 0;

  return (
    <>
      <p className="-mt-3 mb-6 text-sm text-ink-2">
        {ROLE_LABEL[role]} · {stats ? (pending > 0 ? `${pending} élément${pending > 1 ? "s" : ""} en attente de traitement.` : "Rien en attente, tout est à jour.") : "Chargement…"}
      </p>
      {error && (
        <div className="mb-4 flex items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <button type="button" onClick={load} className="text-sm font-bold underline">
            Réessayer
          </button>
        </div>
      )}

      <section aria-label="À traiter" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mine.map((t) => {
          const n = stats?.todo[t.key];
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-2xl border bg-surface p-4 transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)] ${n ? "border-brand/50" : "border-line"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-sm font-bold">{t.title}</p>
                <span className={`min-w-9 rounded-full px-2.5 py-1 text-center font-mono text-sm font-bold ${n ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-2"}`}>{n ?? "…"}</span>
              </div>
              <p className="mt-1 text-xs text-ink-2">{t.hint}</p>
            </Link>
          );
        })}
      </section>

      {stats && showSales && (
        <section className="mt-8" aria-label="Ventes">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Ventes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Chiffre d'affaires, 30 jours" value={`${formatFCFA(stats.sales.revenue30d)} F`} hint={`${stats.sales.paidOrders30d} commande(s) payée(s)`} />
            <Kpi label="Panier moyen, 30 jours" value={`${formatFCFA(stats.sales.averageBasket30d)} F`} />
            <Kpi label="Chiffre d'affaires total" value={`${formatFCFA(stats.sales.revenue)} F`} hint={`${stats.sales.paidOrders} commande(s) payée(s)`} />
            <Kpi label="Clients inscrits" value={String(stats.totals.customers)} hint={`${stats.totals.activeVendors} vendeur(s) actif(s)`} />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm font-bold">Chiffre d&apos;affaires des 14 derniers jours</p>
              <RevenueChart series={stats.series} />
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm font-bold">Commandes par statut</p>
              <ul className="grid gap-1.5 text-sm">
                {Object.entries(STATUS_LABEL).map(([k, label]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-ink-2">{label}</span>
                    <span className="font-mono font-bold">{stats.sales.byStatus[k] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {stats && (showStock || showPrices) && (
        <section className="mt-8 grid gap-3 lg:grid-cols-3" aria-label="Alertes">
          {showStock && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm font-bold">Stock faible</p>
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-ink-2">Aucun produit en rupture ou presque.</p>
              ) : (
                <ul className="grid gap-1.5 text-sm">
                  {stats.lowStock.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className={`font-mono font-bold ${p.stockQuantity === 0 ? "text-down" : ""}`}>
                        {p.stockQuantity} {p.unitLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/backoffice/stock" className="mt-3 inline-block text-xs font-bold text-brand">
                Gérer le stock →
              </Link>
            </div>
          )}
          {showPrices && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm font-bold">Prix à actualiser</p>
              {stats.stalePrices.length === 0 ? (
                <p className="text-sm text-ink-2">Tous les prix ont été relevés récemment.</p>
              ) : (
                <ul className="grid gap-1.5 text-sm">
                  {stats.stalePrices.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-ink-2">{p.lastAt ? formatRelativeTime(p.lastAt) : "jamais relevé"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/backoffice/marches" className="mt-3 inline-block text-xs font-bold text-brand">
                Marchés et agents →
              </Link>
            </div>
          )}
          {showSales && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm font-bold">Produits les plus vendus (30 j)</p>
              {stats.topProducts30d.length === 0 ? (
                <p className="text-sm text-ink-2">Pas encore de vente sur la période.</p>
              ) : (
                <ol className="grid gap-1.5 text-sm">
                  {stats.topProducts30d.map((p, i) => (
                    <li key={p.productId} className="flex justify-between gap-2">
                      <span className="truncate">
                        {i + 1}. {p.name}
                      </span>
                      <span className="font-mono font-bold">{p.units}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>
      )}

      {stats && isAdmin && (
        <p className="mt-8 text-xs text-ink-2">
          {stats.totals.products} produits · {stats.totals.markets} marchés · {stats.totals.publishedProperties} biens publiés · données du {new Date(stats.generatedAt).toLocaleString("fr-FR")}
        </p>
      )}
    </>
  );
}

export default function BackofficeHome() {
  return (
    <BackofficePage roles={ALL_STAFF_ROLES} title="Tableau de bord" width="max-w-6xl">
      {({ token, user }) => <Dashboard token={token} role={user.role} />}
    </BackofficePage>
  );
}

