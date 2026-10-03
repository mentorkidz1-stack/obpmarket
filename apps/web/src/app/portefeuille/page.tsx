"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { LoadError, PageLoading } from "@/components/page-state";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getWallet, withdrawWallet, type WalletSummary } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money, useMoneyText } from "@/components/money";

export default function WalletPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const moneyText = useMoneyText();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    getWallet(token)
      .then(setWallet)
      .catch((err: Error) => setLoadError(err.message));
  }, [ready, token, router, attempt]);

  async function handleWithdraw() {
    if (!token || !wallet) return;
    setBusy(true);
    setError(null);
    try {
      const next = await withdrawWallet(token, wallet.balance);
      setWallet(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du retrait.");
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

  return (
    <>
    <PageHero title="Portefeuille" crumb="Portefeuille" subtitle="Vos gains de revente et de liquidité, retirables vers Mobile Money." />
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-brand p-6 text-on-brand">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Solde disponible</p>
        <p className="font-display text-4xl font-extrabold tabular-nums"><Money value={wallet.balance} /></p>
        {error && <p className="mt-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm text-down">{error}</p>}
        <button
          type="button"
          disabled={busy || wallet.balance <= 0}
          onClick={handleWithdraw}
          className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-brand disabled:opacity-50"
        >
          {busy ? "Retrait en cours…" : "Retirer vers MoMo"}
        </button>
        <p className="mt-2 text-center text-[11px] opacity-80">
          Transféré vers votre compte MTN MoMo ou Moov Money.
        </p>
      </div>

      <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Derniers mouvements</h2>
      {wallet.transactions.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-2">
          Aucun mouvement pour l&apos;instant.
        </p>
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
