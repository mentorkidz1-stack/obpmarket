"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getOrder, getPaymentInfo, payOnline, submitPaymentReference, type Order, type PaymentInfo, type PaymentMethod } from "@/lib/api";
import { formatFCFA } from "@/lib/format";
import { PageHero } from "@/components/page-hero";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "MTN_MOMO", label: "MTN MoMo" },
  { value: "MOOV_MONEY", label: "Moov Money" },
];

export default function OrderPaymentPage(props: PageProps<"/commandes/[id]/paiement">) {
  const { id } = use(props.params);
  const router = useRouter();
  const { token, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [busyOnline, setBusyOnline] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("MTN_MOMO");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    Promise.all([getOrder(token, id), getPaymentInfo()])
      .then(([o, i]) => {
        setOrder(o);
        setInfo(i);
        if (o.status !== "EN_ATTENTE_PAIEMENT") router.replace(`/commandes/${id}`);
      })
      .catch((err: Error) => setError(err.message));
  }, [ready, token, id, router]);

  async function handlePayOnline() {
    if (!token) return;
    setBusyOnline(true);
    setError(null);
    try {
      const { url } = await payOnline(token, id);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création du paiement.");
      setBusyOnline(false);
    }
  }

  async function handleSubmit() {
    if (!token || !reference.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await submitPaymentReference(token, id, method, reference.trim());
      router.push(`/commandes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) {
    return <main className="flex flex-1 items-center justify-center p-8 text-sm text-ink-2">{error}</main>;
  }
  if (!order || !info) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const number = method === "MTN_MOMO" ? info.mtnNumber : info.moovNumber;

  return (
    <>
    <PageHero
      title="Payer ma commande"
      crumb="Paiement"
      subtitle="Mobile Money ou carte bancaire, en toute sécurité. Votre commande est confirmée automatiquement dès la réussite du paiement."
    />
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Montant à payer</p>
        <p className="font-display text-4xl font-extrabold tabular-nums">{formatFCFA(order.totalAmount)} F</p>
      </div>

      {error && <p className="mt-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <button
        type="button"
        disabled={busyOnline}
        onClick={handlePayOnline}
        className="mt-4 w-full rounded-xl bg-brand py-4 text-center font-bold text-on-brand disabled:opacity-60"
      >
        {busyOnline ? "Redirection…" : "Payer maintenant"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-2">
        MTN MoMo, Moov Money, Orange Money ou carte bancaire (Visa/MasterCard).
      </p>

      <div className="mt-6 border-t border-line pt-4 text-center">
        <button type="button" onClick={() => setShowManual((v) => !v)} className="text-xs font-semibold text-ink-2 underline">
          {showManual ? "Masquer le paiement manuel" : "Un souci avec le paiement en ligne ? Payer autrement"}
        </button>
      </div>

      {showManual && (
        <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-2">
            Envoyez le montant exact depuis votre téléphone, puis indiquez ici la référence reçue par SMS. Votre
            commande sera confirmée après vérification.
          </p>

          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">1. Choisissez l&apos;opérateur</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    method === m.value ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand/40 bg-brand-soft p-4">
            <p className="text-xs uppercase tracking-wide text-ink-2">2. Envoyez depuis votre téléphone au</p>
            <p className="font-display text-2xl font-bold tabular-nums">{number}</p>
            <p className="text-xs text-ink-2">
              Au nom de {info.merchantName}. Composez votre code {method === "MTN_MOMO" ? "MTN MoMo" : "Moov Money"}{" "}
              habituel pour envoyer de l&apos;argent, comme d&apos;habitude.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="reference" className="text-xs font-semibold uppercase tracking-wide text-ink-2">
              3. Référence reçue par SMS après l&apos;envoi
            </label>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. MP240912.1234.A56789"
              className="rounded-xl border border-line bg-bg px-3 py-2.5 font-mono outline-none focus:border-brand"
            />
          </div>

          <button
            type="button"
            disabled={busy || !reference.trim()}
            onClick={handleSubmit}
            className="w-full rounded-xl border border-brand py-3 text-center text-sm font-semibold text-brand disabled:opacity-60"
          >
            {busy ? "Envoi…" : "J'ai payé, vérifier ma commande"}
          </button>
        </div>
      )}
    </main>
    </>
  );
}
