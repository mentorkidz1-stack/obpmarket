"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { deletePriceAlert, getPriceAlerts, type PriceAlertRecord } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money } from "@/components/money";
import { PageHero } from "@/components/page-hero";
import { LoadError, PageLoading } from "@/components/page-state";

export default function PriceAlertsPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion?next=/alertes");
      return;
    }
    let alive = true;
    getPriceAlerts(token)
      .then((a) => alive && setAlerts(a))
      .catch((err: Error) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [ready, token, router, attempt]);

  async function remove(id: string) {
    if (!token) return;
    await deletePriceAlert(token, id);
    setAlerts((prev) => prev?.filter((a) => a.id !== id) ?? null);
  }

  if (loadError) {
    return (
      <LoadError
        message={loadError}
        onRetry={() => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (!alerts) return <PageLoading />;

  return (
    <>
      <PageHero title="Alertes de prix" crumb="Alertes" subtitle="Soyez prévenu dès qu'un produit passe sous le prix que vous visez." />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Aucune alerte pour l&apos;instant</p>
            <p className="mt-1 text-sm text-ink-2">Sur la fiche d&apos;un produit, cliquez sur « Me prévenir si le prix baisse ».</p>
            <Link href="/boutique" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <Link href={`/produits/${a.productId}`} className="font-display font-bold hover:text-brand">
                    {a.product.name}
                  </Link>
                  <p className="text-xs text-ink-2">{a.product.unitLabel}</p>
                  <p className="mt-1.5 text-sm">
                    Seuil : <span className="font-bold"><Money value={a.targetPrice} /></span>
                    {a.currentPrice != null && (
                      <span className="text-ink-2">
                        {" "}· prix actuel <Money value={a.currentPrice} />
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${a.active ? "bg-brand-soft text-brand" : "bg-up/10 text-up"}`}>
                    {a.active ? "En surveillance" : `Déclenchée ${a.triggeredAt ? formatRelativeTime(a.triggeredAt) : ""}`}
                  </span>
                  <button type="button" onClick={() => remove(a.id)} className="text-xs font-bold text-down hover:underline">
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
