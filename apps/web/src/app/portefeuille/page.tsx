"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { LoadError, PageLoading } from "@/components/page-state";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getMyPayouts, getWallet, requestPayout, type PayoutRecord, type WalletSummary } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money, useMoneyText } from "@/components/money";

const MIN_PAYOUT = 1000;

const PAYOUT_STATUS = {
  EN_ATTENTE: { label: "En cours de traitement", tone: "bg-accent-soft text-ink" },
  PAYE: { label: "Versé", tone: "bg-up/10 text-up" },
  REFUSE: { label: "Refusé", tone: "bg-down/10 text-down" },
} as const;

const field = "w-full rounded-xl border border-white/30 bg-white/95 px-3 py-2.5 text-sm text-ink outline-none";

export default function WalletPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const moneyText = useMoneyText();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"MTN_MOMO" | "MOOV_MONEY">("MTN_MOMO");
  const [phone, setPhone] = useState("+229");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    Promise.all([getWallet(token), getMyPayouts(token)])
      .then(([w, p]) => {
        setWallet(w);
        setPayouts(p);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [ready, token, router, attempt]);

  function openForm() {
    setAmount(String(Math.floor(wallet?.balance ?? 0)));
    setError(null);
    setDone(null);
    setForm(true);
  }

  async function handleRequest() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await requestPayout(token, { amount: Number(amount), method, phone: phone.trim() });
      setForm(false);
      setDone("Demande envoyée. OBP vous verse les fonds sur ce numéro et vous prévient dès que c'est fait.");
      setAttempt((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la demande.");
    } finally {
      setBusy(false);
    }
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
  if (!wallet) return <PageLoading />;

  const numeric = Number(amount);
  const invalid = !numeric || numeric < MIN_PAYOUT || numeric > wallet.balance || phone.trim().length < 8;

  return (
    <>
      <PageHero title="Portefeuille" crumb="Portefeuille" subtitle="Vos gains de vente, de revente et de liquidité. Demandez un retrait vers Mobile Money, OBP vous verse les fonds." />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-brand p-6 text-on-brand">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Solde disponible</p>
          <p className="font-display text-4xl font-extrabold tabular-nums">
            <Money value={wallet.balance} />
          </p>
          {wallet.pendingPayouts > 0 && (
            <p className="mt-1 text-xs opacity-90">
              <Money value={wallet.pendingPayouts} /> en cours de versement
            </p>
          )}
          {done && <p className="mt-3 rounded-lg bg-white/90 px-3 py-2 text-sm text-up">{done}</p>}

          {form ? (
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold">
                Montant à retirer (minimum {MIN_PAYOUT} F)
                <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={field} />
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Opérateur">
                {(
                  [
                    ["MTN_MOMO", "MTN MoMo"],
                    ["MOOV_MONEY", "Moov Money"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={method === v}
                    onClick={() => setMethod(v)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${method === v ? "border-white bg-white text-brand" : "border-white/40"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Numéro qui reçoit l&apos;argent
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
              </label>
              {error && <p className="rounded-lg bg-white/90 px-3 py-1.5 text-sm text-down">{error}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busy || invalid} onClick={handleRequest} className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-brand disabled:opacity-50">
                  {busy ? "Envoi…" : "Envoyer la demande"}
                </button>
                <button type="button" onClick={() => setForm(false)} className="rounded-xl border border-white/40 px-4 py-3 text-sm font-bold">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={wallet.balance < MIN_PAYOUT}
                onClick={openForm}
                className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-brand disabled:opacity-50"
              >
                Demander un retrait
              </button>
              <p className="mt-2 text-center text-[11px] opacity-80">
                {wallet.balance < MIN_PAYOUT ? `Retrait possible à partir de ${MIN_PAYOUT} F.` : "Versé par OBP sur votre compte MTN MoMo ou Moov Money."}
              </p>
            </>
          )}
        </div>

        {payouts.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Mes demandes de retrait</h2>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {payouts.map((p) => (
                <li key={p.id} className="grid gap-1 border-t border-line px-4 py-3 text-sm first:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-semibold">{moneyText(p.amount)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PAYOUT_STATUS[p.status].tone}`}>{PAYOUT_STATUS[p.status].label}</span>
                  </div>
                  <p className="text-xs text-ink-2">
                    {p.method === "MTN_MOMO" ? "MTN MoMo" : "Moov Money"} · {p.phone} · {formatRelativeTime(p.createdAt)}
                    {p.reference ? ` · réf. ${p.reference}` : ""}
                  </p>
                  {p.rejectionReason && <p className="text-xs text-down">Motif : {p.rejectionReason}</p>}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Derniers mouvements</h2>
        {wallet.transactions.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-2">Aucun mouvement pour l&apos;instant.</p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
            {wallet.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-t border-line px-4 py-3 text-sm first:border-t-0">
                <div>
                  <p className="font-semibold">{t.reason}</p>
                  <p className="text-xs text-ink-2">{formatRelativeTime(t.createdAt)}</p>
                </div>
                <span className={`font-mono font-semibold ${t.amount >= 0 ? "text-up" : "text-ink"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {moneyText(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
