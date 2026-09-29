"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getOrder, reconcilePayment, type Order } from "@/lib/api";
import { formatFCFA } from "@/lib/format";

const STATUS_LABEL: Record<Order["status"], string> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  EN_VERIFICATION: "Paiement en vérification",
  PAYEE: "Payée",
  RETIREE: "Retirée",
  ANNULEE: "Annulée",
};

/** Combien de fois on ré-interroge la commande après un retour de paiement en ligne, en attendant le webhook. */
const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2500;

export default function OrderPage(props: PageProps<"/commandes/[id]">) {
  const { id } = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();
  const { token, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);

  const returningFromOnlinePayment = searchParams.paiement === "succes";

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    getOrder(token, id)
      .then(setOrder)
      .catch((err: Error) => setError(err.message));
  }, [ready, token, id, router]);

  useEffect(() => {
    if (!returningFromOnlinePayment || !token) return;
    if (!order || order.status !== "EN_ATTENTE_PAIEMENT") return;
    if (pollCount.current >= MAX_POLL_ATTEMPTS) return;

    const timer = setTimeout(() => {
      pollCount.current += 1;
      reconcilePayment(token, id).then(setOrder).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [returningFromOnlinePayment, token, id, order]);

  if (error) {
    return <main className="flex flex-1 items-center justify-center p-8 text-sm text-ink-2">{error}</main>;
  }
  if (!order) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <div className="grid justify-items-center gap-2 text-center">
        <div
          className={`grid size-14 place-items-center rounded-full ${
            order.status === "PAYEE" || order.status === "RETIREE"
              ? "bg-up/10 text-up"
              : order.status === "ANNULEE"
                ? "bg-down/10 text-down"
                : "bg-accent-soft text-ink"
          }`}
        >
          {order.status === "PAYEE" || order.status === "RETIREE" ? (
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          ) : order.status === "ANNULEE" ? (
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-7 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 7v5l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
        </div>
        <h1 className="font-display text-xl font-bold">
          {order.status === "EN_ATTENTE_PAIEMENT" && returningFromOnlinePayment
            ? "Confirmation de votre paiement…"
            : STATUS_LABEL[order.status]}
        </h1>
        <p className="text-sm text-ink-2">
          Commande <span className="font-mono">{order.id.slice(0, 10)}</span> · {formatFCFA(order.totalAmount)} F
        </p>
        {order.status === "EN_ATTENTE_PAIEMENT" &&
          (returningFromOnlinePayment ? (
            <p className="max-w-xs text-xs text-ink-2">Ça ne prend que quelques secondes.</p>
          ) : (
            <Link href={`/commandes/${order.id}/paiement`} className="mt-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand">
              Continuer le paiement
            </Link>
          ))}
        {order.status === "EN_VERIFICATION" && (
          <p className="max-w-xs rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-xs">
            Référence {order.paymentReference} reçue. Votre paiement est en cours de confirmation, généralement sous
            quelques heures.
          </p>
        )}
        {order.status === "ANNULEE" && order.rejectionReason && (
          <p className="max-w-xs rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">
            {order.rejectionReason}
          </p>
        )}
      </div>

      <ul className="mt-6 grid gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold">{item.product.name}</p>
                <p className="text-xs text-ink-2">
                  {item.quantity} × {item.product.unitLabel} · {formatFCFA(item.unitPrice)} F
                </p>
              </div>
              <p className="font-display font-bold tabular-nums">{formatFCFA(item.unitPrice * item.quantity)} F</p>
            </div>

            {item.withdrawalCode ? (
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-ink-2">Bon de retrait</p>
                  <p className="font-mono text-lg tracking-[0.2em]">{item.withdrawalCode}</p>
                </div>
                <p className="max-w-[45%] text-right text-[11px] text-ink-2">
                  Présentez ce code au magasin pour récupérer votre produit.
                </p>
              </div>
            ) : item.fulfillment === "DEPOT" && order.status === "PAYEE" ? (
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3">
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                  En dépôt
                </span>
                <p className="max-w-[55%] text-right text-[11px] text-ink-2">
                  Stocké à votre nom. Visible dans « Mon stock ».
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className="flex-1 rounded-xl border border-line py-3 text-center text-sm font-semibold">
          Retour aux prix
        </Link>
        <Link href="/commandes" className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-semibold text-on-brand">
          Mes commandes
        </Link>
      </div>
    </main>
  );
}
