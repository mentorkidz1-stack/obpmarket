"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getMyOrders, type Order } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";

const STATUS_LABEL: Record<Order["status"], string> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  EN_VERIFICATION: "Paiement en vérification",
  PAYEE: "Payée",
  RETIREE: "Retirée",
  ANNULEE: "Annulée",
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
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-block pb-4 text-sm text-ink-2">
        ← Retour aux prix
      </Link>
      <h1 className="font-display text-2xl font-bold">Mes commandes</h1>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">
          Aucune commande pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
          {orders.map((order) => (
            <li key={order.id} className="border-t border-line first:border-t-0">
              <Link href={`/commandes/${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-display font-bold">
                    {order.items.length} article{order.items.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-ink-2">
                    {STATUS_LABEL[order.status]} · {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
                <p className="font-display font-bold tabular-nums">{formatFCFA(order.totalAmount)} F</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
