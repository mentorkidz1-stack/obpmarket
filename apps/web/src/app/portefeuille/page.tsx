"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getWallet, withdrawWallet, type WalletSummary } from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";

export default function WalletPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    getWallet(token).then(setWallet);
  }, [ready, token, router]);

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

  if (!wallet) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-block pb-4 text-sm text-ink-2">
        ← Retour aux prix
      </Link>
      <h1 className="font-display text-2xl font-bold">Portefeuille</h1>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs text-ink-2">Solde disponible</p>
        <p className="font-display text-3xl font-bold tabular-nums">{formatFCFA(wallet.balance)} F</p>
        {error && <p className="mt-2 text-sm text-down">{error}</p>}
        <button
          type="button"
          disabled={busy || wallet.balance <= 0}
          onClick={handleWithdraw}
          className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand disabled:opacity-50"
        >
          {busy ? "Retrait en cours…" : "Retirer vers MoMo"}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-2">
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
                {formatFCFA(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
