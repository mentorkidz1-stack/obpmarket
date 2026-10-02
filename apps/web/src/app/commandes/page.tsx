"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getMyOrders, type Order } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money } from "@/components/money";
import { PageHero } from "@/components/page-hero";

const STATUS_LABEL: Record<Order["status"], string> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  EN_VERIFICATION: "Paiement en vérification",
  PAYEE: "Payée",
  RETIREE: "Retirée",
  ANNULEE: "Annulée",
};

const STATUS_STYLE: Record<Order["status"], string> = {
  EN_ATTENTE_PAIEMENT: "bg-accent-soft text-accent",
  EN_VERIFICATION: "bg-brand-soft text-brand",
  PAYEE: "bg-up/10 text-up",
  RETIREE: "bg-up/10 text-up",
  ANNULEE: "bg-down/10 text-down",
};

export default function OrdersPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    getMyOrders(token).then(setOrders);
  }, [ready, token, router]);

  if (!orders) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <PageHero title="Mes commandes" crumb="Commandes" subtitle="Suivez vos paiements et récupérez vos bons de retrait." />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Aucune commande pour l&apos;instant</p>
            <p className="mt-1 text-sm text-ink-2">Vos commandes apparaîtront ici dès votre premier achat.</p>
            <Link href="/" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/commandes/${order.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold">
                      {order.items.length} article{order.items.length > 1 ? "s" : ""}
                      <span className="ml-2 font-mono text-xs font-normal text-ink-2">#{order.id.slice(0, 8)}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                      <span className={`rounded-md px-2 py-0.5 font-bold ${STATUS_STYLE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <span>{formatRelativeTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <p className="flex-none font-display text-lg font-extrabold tabular-nums"><Money value={order.totalAmount} /></p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
